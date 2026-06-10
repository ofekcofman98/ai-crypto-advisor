export const MOCK_PRICES = {
    BTC: { price: 68420.50, change24h: 3.45, sparkline: [67100, 67400, 67900, 68420] },
    ETH: { price: 3750.20, change24h: -1.20, sparkline: [3810, 3790, 3760, 3750] },
    SOL: { price: 165.80, change24h: 8.12, sparkline: [152, 155, 160, 165] },
  };

  export const MOCK_NEWS = [
    {
      id: "mock-1",
      title: "Bitcoin Institutional Inflows Hit Record Highs as Market Rallies",
      url: "https://cryptopanic.com",
      publishedAt: new Date().toISOString(),
      source: "CryptoNews"
    },
    {
      id: "mock-2",
      title: "Ethereum Developers Confirm Next Major Network Upgrade Timeline",
      url: "https://cryptopanic.com",
      publishedAt: new Date().toISOString(),
      source: "EtherFocus"
    }
  ];
  
  export const MOCK_MEMES = [
    {
      id: "meme-1",
      title: "Buying the Dip vs The Dip Keeps Dipping",
      imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=500&auto=format&fit=crop",
      upvotes: 42,
      downvotes: 3
    },
    {
      id: "meme-2",
      title: "Me explaining Crypto to my family during dinner",
      imageUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?q=80&w=500&auto=format&fit=crop",
      upvotes: 128,
      downvotes: 12
    },
    {
      id: "meme-3",
      title: "Checking portfolio every 45 seconds expecting changes",
      imageUrl: "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=500&auto=format&fit=crop",
      upvotes: 95,
      downvotes: 5
    }
  ];