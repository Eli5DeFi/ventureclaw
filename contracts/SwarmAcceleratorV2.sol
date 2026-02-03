// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title SwarmAcceleratorV2
 * @dev Decentralized startup accelerator with multi-chain support
 * 
 * Features:
 * - Stablecoin fundraising (USDC, USDT, DAI)
 * - Futarchy prediction markets
 * - Multi-chain support (Base, Optimism, Arbitrum, Ethereum)
 * - Anti-sybil mechanisms
 * - Agent-driven funding decisions
 */
contract SwarmAcceleratorV2 is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // Supported stablecoins
    mapping(address => bool) public supportedStablecoins;
    
    // Startup structure
    struct Startup {
        string id; // Off-chain ID
        address founder;
        uint256 fundingGoal;
        uint256 softCap;
        uint256 hardCap;
        uint256 raised;
        uint256 deadline;
        bool approved;
        bool funded;
        bool active;
        uint8 agentScore; // 0-100
        uint256 createdAt;
    }
    
    // Futarchy prediction market
    struct PredictionMarket {
        uint256 yesPool;
        uint256 noPool;
        uint256 yesShares;
        uint256 noShares;
        bool resolved;
        bool outcome;
        mapping(address => uint256) yesPositions;
        mapping(address => uint256) noPositions;
    }
    
    // Contribution tracking
    struct Contribution {
        address contributor;
        address stablecoin;
        uint256 amount;
        uint256 timestamp;
    }
    
    // Anti-sybil
    struct ContributorProfile {
        uint256 totalContributions;
        uint256 successfulInvestments;
        uint256 reputationScore;
        bool verified;
    }
    
    mapping(string => Startup) public startups;
    mapping(string => PredictionMarket) public markets;
    mapping(string => Contribution[]) public contributions;
    mapping(address => ContributorProfile) public contributorProfiles;
    
    // Events
    event StartupRegistered(string indexed id, address indexed founder, uint256 fundingGoal);
    event ContributionMade(string indexed id, address indexed contributor, uint256 amount, address stablecoin);
    event FutarchyResolved(string indexed id, bool outcome);
    event FundsReleased(string indexed id, uint256 amount);
    event AgentScoreUpdated(string indexed id, uint8 score);
    event StablecoinAdded(address indexed token);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Add supported stablecoin
     */
    function addStablecoin(address token) external onlyRole(ADMIN_ROLE) {
        supportedStablecoins[token] = true;
        emit StablecoinAdded(token);
    }
    
    /**
     * @dev Register a new startup (called by AI agents)
     */
    function registerStartup(
        string memory _id,
        address _founder,
        uint256 _fundingGoal,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _duration
    ) external onlyRole(AGENT_ROLE) whenNotPaused {
        require(!startups[_id].active, "Startup already registered");
        require(_softCap <= _hardCap, "Invalid caps");
        require(_founder != address(0), "Invalid founder");
        
        Startup storage startup = startups[_id];
        startup.id = _id;
        startup.founder = _founder;
        startup.fundingGoal = _fundingGoal;
        startup.softCap = _softCap;
        startup.hardCap = _hardCap;
        startup.deadline = block.timestamp + _duration;
        startup.active = true;
        startup.createdAt = block.timestamp;
        
        emit StartupRegistered(_id, _founder, _fundingGoal);
    }
    
    /**
     * @dev Update agent score (AI analysis result)
     */
    function updateAgentScore(
        string memory _id,
        uint8 _score
    ) external onlyRole(AGENT_ROLE) {
        require(startups[_id].active, "Startup not found");
        require(_score <= 100, "Invalid score");
        
        startups[_id].agentScore = _score;
        
        // Auto-approve if score is high enough
        if (_score >= 75) {
            startups[_id].approved = true;
        }
        
        emit AgentScoreUpdated(_id, _score);
    }
    
    /**
     * @dev Contribute to a startup
     */
    function contribute(
        string memory _id,
        address _stablecoin,
        uint256 _amount
    ) external nonReentrant whenNotPaused {
        Startup storage startup = startups[_id];
        
        require(startup.active, "Startup not active");
        require(startup.approved, "Startup not approved");
        require(block.timestamp < startup.deadline, "Funding period ended");
        require(startup.raised + _amount <= startup.hardCap, "Exceeds hard cap");
        require(supportedStablecoins[_stablecoin], "Stablecoin not supported");
        
        // Transfer stablecoin from contributor
        IERC20(_stablecoin).transferFrom(msg.sender, address(this), _amount);
        
        startup.raised += _amount;
        
        // Record contribution
        contributions[_id].push(Contribution({
            contributor: msg.sender,
            stablecoin: _stablecoin,
            amount: _amount,
            timestamp: block.timestamp
        }));
        
        // Update contributor profile
        ContributorProfile storage profile = contributorProfiles[msg.sender];
        profile.totalContributions += _amount;
        
        emit ContributionMade(_id, msg.sender, _amount, _stablecoin);
    }
    
    /**
     * @dev Create prediction market for futarchy
     */
    function createPredictionMarket(
        string memory _id
    ) external onlyRole(AGENT_ROLE) {
        require(startups[_id].active, "Startup not found");
        require(!markets[_id].resolved, "Market already exists");
        
        PredictionMarket storage market = markets[_id];
        // Market initialized with zero values
    }
    
    /**
     * @dev Buy prediction market shares (YES or NO)
     */
    function buyPredictionShares(
        string memory _id,
        bool _yes,
        uint256 _amount,
        address _stablecoin
    ) external nonReentrant whenNotPaused {
        require(supportedStablecoins[_stablecoin], "Stablecoin not supported");
        
        PredictionMarket storage market = markets[_id];
        require(!market.resolved, "Market resolved");
        
        // Transfer stablecoin
        IERC20(_stablecoin).transferFrom(msg.sender, address(this), _amount);
        
        if (_yes) {
            market.yesPool += _amount;
            market.yesShares += _amount; // Simplified: 1:1 ratio
            market.yesPositions[msg.sender] += _amount;
        } else {
            market.noPool += _amount;
            market.noShares += _amount;
            market.noPositions[msg.sender] += _amount;
        }
    }
    
    /**
     * @dev Resolve futarchy market (called by AI agents based on outcome)
     */
    function resolveFutarchy(
        string memory _id,
        bool _outcome
    ) external onlyRole(AGENT_ROLE) {
        PredictionMarket storage market = markets[_id];
        require(!market.resolved, "Already resolved");
        
        market.resolved = true;
        market.outcome = _outcome;
        
        // If YES wins, approve the startup
        if (_outcome) {
            startups[_id].approved = true;
        }
        
        emit FutarchyResolved(_id, _outcome);
    }
    
    /**
     * @dev Claim prediction market winnings
     */
    function claimPredictionWinnings(
        string memory _id,
        address _stablecoin
    ) external nonReentrant {
        PredictionMarket storage market = markets[_id];
        require(market.resolved, "Market not resolved");
        
        uint256 winnings = 0;
        
        if (market.outcome) {
            // YES won
            uint256 userShares = market.yesPositions[msg.sender];
            if (userShares > 0) {
                winnings = (userShares * (market.yesPool + market.noPool)) / market.yesShares;
                market.yesPositions[msg.sender] = 0;
            }
        } else {
            // NO won
            uint256 userShares = market.noPositions[msg.sender];
            if (userShares > 0) {
                winnings = (userShares * (market.yesPool + market.noPool)) / market.noShares;
                market.noPositions[msg.sender] = 0;
            }
        }
        
        require(winnings > 0, "No winnings");
        
        IERC20(_stablecoin).transfer(msg.sender, winnings);
    }
    
    /**
     * @dev Release funds to founder after successful funding
     */
    function releaseFunds(string memory _id, address _stablecoin) external nonReentrant {
        Startup storage startup = startups[_id];
        
        require(startup.active, "Startup not active");
        require(startup.approved, "Not approved");
        require(!startup.funded, "Already funded");
        require(block.timestamp >= startup.deadline, "Funding not ended");
        require(startup.raised >= startup.softCap, "Soft cap not reached");
        
        startup.funded = true;
        
        // Transfer funds to founder (minus platform fee: 2.5%)
        uint256 platformFee = (startup.raised * 25) / 1000; // 2.5%
        uint256 founderAmount = startup.raised - platformFee;
        
        IERC20(_stablecoin).transfer(startup.founder, founderAmount);
        // Platform fee stays in contract for operations
        
        emit FundsReleased(_id, founderAmount);
    }
    
    /**
     * @dev Refund contributors if soft cap not reached
     */
    function refund(string memory _id, address _stablecoin) external nonReentrant {
        Startup storage startup = startups[_id];
        
        require(block.timestamp >= startup.deadline, "Funding not ended");
        require(startup.raised < startup.softCap, "Soft cap reached");
        
        // Find user's contribution
        Contribution[] storage contribs = contributions[_id];
        uint256 refundAmount = 0;
        
        for (uint i = 0; i < contribs.length; i++) {
            if (contribs[i].contributor == msg.sender && contribs[i].stablecoin == _stablecoin) {
                refundAmount += contribs[i].amount;
                contribs[i].amount = 0; // Mark as refunded
            }
        }
        
        require(refundAmount > 0, "No contribution found");
        
        IERC20(_stablecoin).transfer(msg.sender, refundAmount);
    }
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Get startup details
     */
    function getStartup(string memory _id) external view returns (
        address founder,
        uint256 fundingGoal,
        uint256 raised,
        uint256 deadline,
        bool approved,
        bool funded,
        uint8 agentScore
    ) {
        Startup storage startup = startups[_id];
        return (
            startup.founder,
            startup.fundingGoal,
            startup.raised,
            startup.deadline,
            startup.approved,
            startup.funded,
            startup.agentScore
        );
    }
    
    /**
     * @dev Get contribution count
     */
    function getContributionCount(string memory _id) external view returns (uint256) {
        return contributions[_id].length;
    }
}
