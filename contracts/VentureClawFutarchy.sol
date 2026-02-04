// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title VentureClawFutarchy
 * @dev Milestone-based funding with futarchy governance and verifier agent swarm
 * Inspired by MetaDAO's conditional funding model
 */
contract VentureClawFutarchy is AccessControl, ReentrancyGuard {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Milestone {
        uint256 amount;          // Funding amount to unlock
        string kpiDescription;   // What needs to be achieved
        uint256 deadline;        // Unix timestamp deadline
        bool verified;           // Verified by agent swarm
        bool unlocked;           // Funds released to founder
        uint8 verifierApprovals; // Number of verifier approvals (need 3/5)
        mapping(address => bool) hasVoted; // Track verifier votes
    }

    struct Company {
        address founder;
        string name;
        uint256 totalFunding;    // Total funding amount
        uint256 equityPercent;   // Equity taken (e.g., 7% = 700 basis points)
        uint256 fundsUnlocked;   // Amount already released
        bool active;
        uint256 yesTokenPrice;   // Last YES token price (in basis points)
        uint256 noTokenPrice;    // Last NO token price (in basis points)
        uint256 milestoneCount;
    }

    struct PredictionMarket {
        uint256 yesTokenSupply;
        uint256 noTokenSupply;
        uint256 totalLiquidity;
        bool settled;
        bool outcome;            // true = milestones hit, false = failed
    }

    // Storage
    mapping(uint256 => Company) public companies;
    mapping(uint256 => mapping(uint256 => Milestone)) public milestones;
    mapping(uint256 => PredictionMarket) public markets;
    
    uint256 public companyCount;
    address public treasuryAddress;
    IERC20 public usdcToken;

    // Events
    event CompanyRegistered(uint256 indexed companyId, address indexed founder, string name, uint256 totalFunding);
    event MilestoneCreated(uint256 indexed companyId, uint256 indexed milestoneId, uint256 amount, string kpi);
    event MilestoneVerified(uint256 indexed companyId, uint256 indexed milestoneId, address indexed verifier);
    event FundsUnlocked(uint256 indexed companyId, uint256 indexed milestoneId, uint256 amount);
    event MarketTraded(uint256 indexed companyId, bool isYesToken, uint256 amount, uint256 price);
    event MarketSettled(uint256 indexed companyId, bool outcome);

    constructor(address _usdcToken, address _treasuryAddress) {
        usdcToken = IERC20(_usdcToken);
        treasuryAddress = _treasuryAddress;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register a new company with funding and milestones
     */
    function registerCompany(
        address _founder,
        string calldata _name,
        uint256 _totalFunding,
        uint256 _equityPercent,
        uint256[] calldata _milestoneAmounts,
        string[] calldata _milestoneKPIs,
        uint256[] calldata _milestoneDeadlines
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(_milestoneAmounts.length == _milestoneKPIs.length, "Length mismatch");
        require(_milestoneAmounts.length == _milestoneDeadlines.length, "Length mismatch");

        uint256 companyId = companyCount++;
        
        Company storage company = companies[companyId];
        company.founder = _founder;
        company.name = _name;
        company.totalFunding = _totalFunding;
        company.equityPercent = _equityPercent;
        company.active = true;
        company.milestoneCount = _milestoneAmounts.length;

        // Create milestones
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            Milestone storage milestone = milestones[companyId][i];
            milestone.amount = _milestoneAmounts[i];
            milestone.kpiDescription = _milestoneKPIs[i];
            milestone.deadline = _milestoneDeadlines[i];
            
            emit MilestoneCreated(companyId, i, _milestoneAmounts[i], _milestoneKPIs[i]);
        }

        // Initialize prediction market
        markets[companyId] = PredictionMarket({
            yesTokenSupply: 0,
            noTokenSupply: 0,
            totalLiquidity: 0,
            settled: false,
            outcome: false
        });

        emit CompanyRegistered(companyId, _founder, _name, _totalFunding);
        
        return companyId;
    }

    /**
     * @dev Verifier agent votes to approve a milestone
     * Requires 3 of 5 verifiers to approve (multi-sig)
     */
    function verifyMilestone(
        uint256 _companyId,
        uint256 _milestoneId,
        bool _approve
    ) external onlyRole(VERIFIER_ROLE) nonReentrant {
        Company storage company = companies[_companyId];
        require(company.active, "Company not active");
        
        Milestone storage milestone = milestones[_companyId][_milestoneId];
        require(!milestone.verified, "Already verified");
        require(!milestone.hasVoted[msg.sender], "Already voted");
        require(block.timestamp <= milestone.deadline + 7 days, "Past dispute window");

        milestone.hasVoted[msg.sender] = true;

        if (_approve) {
            milestone.verifierApprovals++;
            
            emit MilestoneVerified(_companyId, _milestoneId, msg.sender);

            // 3 of 5 verifiers = approved
            if (milestone.verifierApprovals >= 3) {
                milestone.verified = true;
                _unlockFunds(_companyId, _milestoneId);
            }
        }
    }

    /**
     * @dev Internal function to unlock funds when milestone verified
     */
    function _unlockFunds(uint256 _companyId, uint256 _milestoneId) internal {
        Company storage company = companies[_companyId];
        Milestone storage milestone = milestones[_companyId][_milestoneId];
        
        require(!milestone.unlocked, "Already unlocked");
        require(milestone.verified, "Not verified");

        milestone.unlocked = true;
        company.fundsUnlocked += milestone.amount;

        // Transfer USDC to founder
        require(
            usdcToken.transfer(company.founder, milestone.amount),
            "Transfer failed"
        );

        emit FundsUnlocked(_companyId, _milestoneId, milestone.amount);
    }

    /**
     * @dev Trade prediction market tokens (YES/NO)
     * Simple constant product market maker (x * y = k)
     */
    function trade(
        uint256 _companyId,
        bool _isYesToken,
        uint256 _amountIn
    ) external nonReentrant returns (uint256 amountOut) {
        PredictionMarket storage market = markets[_companyId];
        require(!market.settled, "Market settled");
        require(_amountIn > 0, "Invalid amount");

        // Transfer USDC from trader
        require(
            usdcToken.transferFrom(msg.sender, address(this), _amountIn),
            "Transfer failed"
        );

        // Calculate output using constant product formula
        if (_isYesToken) {
            uint256 newYesSupply = market.yesTokenSupply + _amountIn;
            amountOut = (market.totalLiquidity * _amountIn) / newYesSupply;
            
            market.yesTokenSupply = newYesSupply;
            market.yesTokenPrice = (market.yesTokenSupply * 10000) / market.totalLiquidity;
        } else {
            uint256 newNoSupply = market.noTokenSupply + _amountIn;
            amountOut = (market.totalLiquidity * _amountIn) / newNoSupply;
            
            market.noTokenSupply = newNoSupply;
            market.noTokenPrice = (market.noTokenSupply * 10000) / market.totalLiquidity;
        }

        market.totalLiquidity += _amountIn;

        // Update company's token prices
        companies[_companyId].yesTokenPrice = market.yesTokenPrice;
        companies[_companyId].noTokenPrice = market.noTokenPrice;

        emit MarketTraded(_companyId, _isYesToken, _amountIn, _isYesToken ? market.yesTokenPrice : market.noTokenPrice);

        // Note: In production, would issue ERC-20 tokens representing YES/NO positions
        // For MVP, tracking off-chain
    }

    /**
     * @dev Settle prediction market when all milestones complete or deadline passed
     */
    function settleMarket(uint256 _companyId, bool _outcome) external onlyRole(ADMIN_ROLE) {
        PredictionMarket storage market = markets[_companyId];
        require(!market.settled, "Already settled");

        market.settled = true;
        market.outcome = _outcome;

        emit MarketSettled(_companyId, _outcome);

        // Winning token holders can redeem 1:1 for USDC
        // Losing token holders get nothing
        // Implementation: ERC-20 token redemption (off-chain for MVP)
    }

    /**
     * @dev Add verifier agent to swarm
     */
    function addVerifier(address _verifier) external onlyRole(ADMIN_ROLE) {
        grantRole(VERIFIER_ROLE, _verifier);
    }

    /**
     * @dev Remove verifier agent
     */
    function removeVerifier(address _verifier) external onlyRole(ADMIN_ROLE) {
        revokeRole(VERIFIER_ROLE, _verifier);
    }

    /**
     * @dev Get company details
     */
    function getCompany(uint256 _companyId) external view returns (
        address founder,
        string memory name,
        uint256 totalFunding,
        uint256 equityPercent,
        uint256 fundsUnlocked,
        bool active,
        uint256 yesTokenPrice,
        uint256 noTokenPrice
    ) {
        Company storage company = companies[_companyId];
        return (
            company.founder,
            company.name,
            company.totalFunding,
            company.equityPercent,
            company.fundsUnlocked,
            company.active,
            company.yesTokenPrice,
            company.noTokenPrice
        );
    }

    /**
     * @dev Get milestone details
     */
    function getMilestone(uint256 _companyId, uint256 _milestoneId) external view returns (
        uint256 amount,
        string memory kpiDescription,
        uint256 deadline,
        bool verified,
        bool unlocked,
        uint8 verifierApprovals
    ) {
        Milestone storage milestone = milestones[_companyId][_milestoneId];
        return (
            milestone.amount,
            milestone.kpiDescription,
            milestone.deadline,
            milestone.verified,
            milestone.unlocked,
            milestone.verifierApprovals
        );
    }

    /**
     * @dev Emergency withdrawal (admin only, for stuck funds)
     */
    function emergencyWithdraw(uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(usdcToken.transfer(treasuryAddress, _amount), "Transfer failed");
    }
}
