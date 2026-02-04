// OTC Order Book - Secondary Market for Equity/Tokens/Shares
// Matches buy/sell orders, provides liquidity, price discovery

export type AssetType = 'equity' | 'token' | 'safe' | 'debt' | 'warrant';

export interface Asset {
  id: string;
  symbol: string; // "ACME-EQUITY", "TOKEN-XYZ"
  name: string;
  type: AssetType;
  companyId: string;
  
  // Metadata
  totalSupply?: number;
  circulatingSupply?: number;
  contractAddress?: string; // For tokens
  
  // Restrictions
  accreditedOnly: boolean;
  lockupPeriod?: number; // days
  transferRestrictions?: string;
  
  createdAt: Date;
  active: boolean;
}

export interface Order {
  id: string;
  assetId: string;
  userId: string;
  
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'rfi'; // RFI = Request for Interest (dark pool)
  
  quantity: number;
  price?: number; // Null for market orders
  
  // Limits
  minQuantity?: number; // Minimum fill size
  maxQuantity?: number; // For RFI orders
  
  // Status
  status: 'open' | 'partial' | 'filled' | 'cancelled' | 'expired';
  filledQuantity: number;
  
  // Privacy
  isPublic: boolean; // False = dark pool order
  
  // Timing
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trade {
  id: string;
  assetId: string;
  buyOrderId: string;
  sellOrderId: string;
  buyerId: string;
  sellerId: string;
  
  quantity: number;
  price: number;
  totalValue: number;
  
  // Settlement
  settlementStatus: 'pending' | 'settled' | 'failed';
  settlementMethod: 'on-chain' | 'escrow' | 'manual';
  settlementTxHash?: string;
  
  // Fees
  buyerFee: number;
  sellerFee: number;
  
  executedAt: Date;
  settledAt?: Date;
}

export interface OrderBookSnapshot {
  assetId: string;
  timestamp: Date;
  
  // Public order book (visible orders)
  bids: Array<{ price: number; quantity: number; orders: number }>;
  asks: Array<{ price: number; quantity: number; orders: number }>;
  
  // Market stats
  lastPrice: number;
  bidAskSpread: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  trades24h: number;
  
  // Dark pool indicators (aggregate, no detail)
  darkPoolBuyInterest: number; // Total quantity in RFI buy orders
  darkPoolSellInterest: number; // Total quantity in RFI sell orders
}

// Matching Engine
export class OTCOrderBook {
  private orders: Map<string, Order> = new Map();
  private trades: Trade[] = [];
  
  constructor(private assetId: string) {}
  
  // Place order
  placeOrder(order: Omit<Order, 'id' | 'status' | 'filledQuantity' | 'createdAt' | 'updatedAt'>): Order {
    const newOrder: Order = {
      ...order,
      id: this.generateOrderId(),
      status: 'open',
      filledQuantity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.orders.set(newOrder.id, newOrder);
    
    // Try to match immediately
    if (order.orderType === 'market' || order.orderType === 'limit') {
      this.matchOrder(newOrder);
    }
    
    return newOrder;
  }
  
  // Cancel order
  cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (!order || order.status === 'filled' || order.status === 'cancelled') {
      return false;
    }
    
    order.status = 'cancelled';
    order.updatedAt = new Date();
    return true;
  }
  
  // Match order against order book
  private matchOrder(incomingOrder: Order): void {
    if (incomingOrder.status === 'filled' || incomingOrder.status === 'cancelled') {
      return;
    }
    
    // Get opposite side orders
    const oppositeOrders = Array.from(this.orders.values()).filter((o) => {
      if (o.id === incomingOrder.id) return false;
      if (o.status !== 'open' && o.status !== 'partial') return false;
      if (o.assetId !== incomingOrder.assetId) return false;
      if (o.side === incomingOrder.side) return false;
      
      // Check price compatibility
      if (incomingOrder.orderType === 'limit' && o.orderType === 'limit') {
        if (incomingOrder.side === 'buy') {
          // Buy limit: can match sells at or below limit price
          return o.price! <= incomingOrder.price!;
        } else {
          // Sell limit: can match buys at or above limit price
          return o.price! >= incomingOrder.price!;
        }
      }
      
      return true; // Market orders match anything
    });
    
    // Sort by price-time priority
    oppositeOrders.sort((a, b) => {
      // Price priority
      if (a.price && b.price) {
        if (incomingOrder.side === 'buy') {
          // Match cheapest sells first
          if (a.price !== b.price) return a.price - b.price;
        } else {
          // Match highest buys first
          if (a.price !== b.price) return b.price - a.price;
        }
      }
      
      // Time priority (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    
    // Match against sorted orders
    for (const oppositeOrder of oppositeOrders) {
      if (incomingOrder.status === 'filled') break;
      
      const remainingIncoming = incomingOrder.quantity - incomingOrder.filledQuantity;
      const remainingOpposite = oppositeOrder.quantity - oppositeOrder.filledQuantity;
      
      if (remainingIncoming <= 0 || remainingOpposite <= 0) continue;
      
      // Check minimum fill sizes
      const matchQuantity = Math.min(remainingIncoming, remainingOpposite);
      
      if (incomingOrder.minQuantity && matchQuantity < incomingOrder.minQuantity) {
        continue; // Skip if below min fill
      }
      
      if (oppositeOrder.minQuantity && matchQuantity < oppositeOrder.minQuantity) {
        continue;
      }
      
      // Determine execution price
      const executionPrice =
        incomingOrder.orderType === 'market'
          ? oppositeOrder.price!
          : oppositeOrder.orderType === 'market'
          ? incomingOrder.price!
          : oppositeOrder.price!; // Limit vs limit: use resting order price
      
      // Execute trade
      this.executeTrade(incomingOrder, oppositeOrder, matchQuantity, executionPrice);
    }
  }
  
  // Execute trade
  private executeTrade(
    buyOrder: Order,
    sellOrder: Order,
    quantity: number,
    price: number
  ): void {
    // Ensure buyOrder is the buy side
    if (buyOrder.side === 'sell') {
      [buyOrder, sellOrder] = [sellOrder, buyOrder];
    }
    
    const trade: Trade = {
      id: this.generateTradeId(),
      assetId: this.assetId,
      buyOrderId: buyOrder.id,
      sellOrderId: sellOrder.id,
      buyerId: buyOrder.userId,
      sellerId: sellOrder.userId,
      quantity,
      price,
      totalValue: quantity * price,
      settlementStatus: 'pending',
      settlementMethod: 'escrow', // Default
      buyerFee: this.calculateFee(quantity * price, 'buyer'),
      sellerFee: this.calculateFee(quantity * price, 'seller'),
      executedAt: new Date(),
    };
    
    // Update order statuses
    buyOrder.filledQuantity += quantity;
    sellOrder.filledQuantity += quantity;
    
    if (buyOrder.filledQuantity >= buyOrder.quantity) {
      buyOrder.status = 'filled';
    } else {
      buyOrder.status = 'partial';
    }
    
    if (sellOrder.filledQuantity >= sellOrder.quantity) {
      sellOrder.status = 'filled';
    } else {
      sellOrder.status = 'partial';
    }
    
    buyOrder.updatedAt = new Date();
    sellOrder.updatedAt = new Date();
    
    this.trades.push(trade);
    
    console.log(`[OTC] Trade executed: ${quantity} @ $${price} = $${trade.totalValue}`);
  }
  
  // Get order book snapshot
  getSnapshot(): OrderBookSnapshot {
    const publicOrders = Array.from(this.orders.values()).filter(
      (o) => o.isPublic && (o.status === 'open' || o.status === 'partial')
    );
    
    // Aggregate bids (buy orders)
    const bidMap = new Map<number, { quantity: number; orders: number }>();
    publicOrders
      .filter((o) => o.side === 'buy' && o.price)
      .forEach((o) => {
        const remaining = o.quantity - o.filledQuantity;
        const existing = bidMap.get(o.price!) || { quantity: 0, orders: 0 };
        bidMap.set(o.price!, {
          quantity: existing.quantity + remaining,
          orders: existing.orders + 1,
        });
      });
    
    // Aggregate asks (sell orders)
    const askMap = new Map<number, { quantity: number; orders: number }>();
    publicOrders
      .filter((o) => o.side === 'sell' && o.price)
      .forEach((o) => {
        const remaining = o.quantity - o.filledQuantity;
        const existing = askMap.get(o.price!) || { quantity: 0, orders: 0 };
        askMap.set(o.price!, {
          quantity: existing.quantity + remaining,
          orders: existing.orders + 1,
        });
      });
    
    const bids = Array.from(bidMap.entries())
      .map(([price, data]) => ({ price, ...data }))
      .sort((a, b) => b.price - a.price); // Highest bid first
    
    const asks = Array.from(askMap.entries())
      .map(([price, data]) => ({ price, ...data }))
      .sort((a, b) => a.price - b.price); // Lowest ask first
    
    // Calculate stats
    const recentTrades = this.trades.slice(-100); // Last 100 trades
    const trades24h = recentTrades.filter(
      (t) => Date.now() - t.executedAt.getTime() < 24 * 60 * 60 * 1000
    );
    
    const volume24h = trades24h.reduce((sum, t) => sum + t.totalValue, 0);
    const lastPrice = recentTrades.length > 0 ? recentTrades[recentTrades.length - 1].price : 0;
    const high24h = trades24h.length > 0 ? Math.max(...trades24h.map((t) => t.price)) : 0;
    const low24h = trades24h.length > 0 ? Math.min(...trades24h.map((t) => t.price)) : 0;
    
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const bestAsk = asks.length > 0 ? asks[0].price : 0;
    const bidAskSpread = bestAsk && bestBid ? bestAsk - bestBid : 0;
    
    // Dark pool indicators (aggregate only)
    const darkOrders = Array.from(this.orders.values()).filter(
      (o) => !o.isPublic && (o.status === 'open' || o.status === 'partial')
    );
    
    const darkPoolBuyInterest = darkOrders
      .filter((o) => o.side === 'buy')
      .reduce((sum, o) => sum + (o.quantity - o.filledQuantity), 0);
    
    const darkPoolSellInterest = darkOrders
      .filter((o) => o.side === 'sell')
      .reduce((sum, o) => sum + (o.quantity - o.filledQuantity), 0);
    
    return {
      assetId: this.assetId,
      timestamp: new Date(),
      bids,
      asks,
      lastPrice,
      bidAskSpread,
      volume24h,
      high24h,
      low24h,
      trades24h: trades24h.length,
      darkPoolBuyInterest,
      darkPoolSellInterest,
    };
  }
  
  // Helper: Generate order ID
  private generateOrderId(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Helper: Generate trade ID
  private generateTradeId(): string {
    return `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Helper: Calculate fee (0.25% default)
  private calculateFee(value: number, side: 'buyer' | 'seller'): number {
    const feeRate = 0.0025; // 0.25%
    return value * feeRate;
  }
  
  // Get all trades
  getTrades(limit: number = 50): Trade[] {
    return this.trades.slice(-limit).reverse();
  }
  
  // Get user orders
  getUserOrders(userId: string): Order[] {
    return Array.from(this.orders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

// Order Book Manager (manages multiple assets)
export class OrderBookManager {
  private orderBooks: Map<string, OTCOrderBook> = new Map();
  
  getOrderBook(assetId: string): OTCOrderBook {
    if (!this.orderBooks.has(assetId)) {
      this.orderBooks.set(assetId, new OTCOrderBook(assetId));
    }
    return this.orderBooks.get(assetId)!;
  }
  
  getAllSnapshots(): OrderBookSnapshot[] {
    return Array.from(this.orderBooks.values()).map((ob) => ob.getSnapshot());
  }
}

// Singleton instance
export const orderBookManager = new OrderBookManager();
