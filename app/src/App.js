import React, { useEffect, useState, useRef } from 'react';
import { Keypair, Connection, LAMPORTS_PER_SOL, Transaction, PublicKey } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';

// Fix Buffer issue for browsers
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer').Buffer;
}

function App() {
  const [mint, setMint] = useState(null);
  const [nftChain, setNftChain] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);

  // Wallet State
  const [wallet, setWallet] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletSecretKey, setWalletSecretKey] = useState('');

  // Token Minting State
  const [minting, setMinting] = useState(false);
  const [mintResponse, setMintResponse] = useState(null);

  const timelineRef = useRef(null);
  const nftRefs = useRef([]);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Get API URL from environment variable with fallback for development
  const API_URL = process.env.REACT_APP_HOST || 'http://localhost:3000';

  // Enhanced Miko color palette
  const mikoColors = {
    primary: '#2A2D43',
    secondary: '#4A4E69',
    accent: '#F25F5C',
    highlight: '#FFE74C',
    background: '#1A1C2B',
    surface: '#2D3047',
    lightSurface: '#3A3E5B',
    text: '#FFFFFF',
    textSecondary: '#B8BBD5',
    border: '#3A3E5B',
    success: '#4CAF50',
    warning: '#FF9800'
  };

  // Helper function to create token accounts for a wallet
  const createTokenAccountsForWallet = async (connection, keypair) => {
    try {
      console.log("Creating token accounts for wallet...");
      
      // Common NFT collections on devnet - REMOVED WSOL to avoid Buffer issues
      const commonCollections = [
        // Just create empty array for now to avoid Buffer issues
      ];
      
      console.log("⚠️ Skipping token account creation to avoid Buffer issues in browser");
      
      // We'll implement this properly later with a different approach
      return;

    } catch (error) {
      console.error("Error creating token accounts:", error);
      // Don't throw error - wallet creation should still succeed even if token accounts fail
    }
  };

  // Create New Solana Wallet
  // Create New Solana Wallet
const createNewWallet = async () => {
  setIsCreatingWallet(true);
  setError(null);
  
  try {
    console.log("🔑 Step 1: Generating keypair...");
    // Generate new keypair
    const keypair = Keypair.generate();
    const publicKey = keypair.publicKey.toString();
    console.log("✅ Keypair generated:", publicKey);

    console.log("🌐 Step 2: Connecting to Solana...");
    // Connect to Solana devnet with multiple RPC endpoints
    const rpcEndpoints = [
      'https://api.devnet.solana.com',
      'https://devnet.helius-rpc.com/',
      'https://solana-devnet.rpcpool.com/'
    ];
    
    let connection;
    let connectionError;
    
    // Try different RPC endpoints
    for (const endpoint of rpcEndpoints) {
      try {
        connection = new Connection(endpoint, 'confirmed');
        // Test the connection
        await connection.getVersion();
        console.log(`✅ Connected to RPC: ${endpoint}`);
        break;
      } catch (err) {
        connectionError = err;
        console.log(`❌ Failed to connect to ${endpoint}:`, err.message);
        continue;
      }
    }
    
    if (!connection) {
      throw new Error('All RPC endpoints failed. Please try again later.');
    }

    console.log("💰 Step 3: Checking balance...");
    let balance = await connection.getBalance(keypair.publicKey);
    console.log(`✅ Initial balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    // Automatic airdrop with retry logic
    if (balance === 0) {
      console.log("🔄 Step 3.5: Requesting automatic airdrop...");
      
      let airdropSuccess = false;
      let lastAirdropError;
      
      // Try airdrop with multiple RPCs and retries
      for (let attempt = 1; attempt <= 3; attempt++) {
        for (const endpoint of rpcEndpoints) {
          try {
            console.log(`🔄 Airdrop attempt ${attempt} on ${endpoint}...`);
            const airdropConnection = new Connection(endpoint, 'confirmed');
            
            const signature = await airdropConnection.requestAirdrop(
              keypair.publicKey,
              0.1 * LAMPORTS_PER_SOL // Request 0.1 SOL to avoid rate limits
            );
            
            // Wait for confirmation with timeout
            console.log("⏳ Waiting for airdrop confirmation...");
            const confirmation = await airdropConnection.confirmTransaction(signature, 'confirmed');
            
            if (confirmation.value.err) {
              throw new Error(`Airdrop failed: ${JSON.stringify(confirmation.value.err)}`);
            }
            
            console.log("✅ Airdrop completed successfully");
            airdropSuccess = true;
            break;
            
          } catch (airdropError) {
            lastAirdropError = airdropError;
            console.log(`❌ Airdrop failed on ${endpoint}:`, airdropError.message);
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
          }
        }
        if (airdropSuccess) break;
      }
      
      if (!airdropSuccess) {
        console.warn("⚠️ Automatic airdrop failed, but continuing with wallet creation");
        // Don't throw error - continue with wallet creation even if airdrop fails
        setError(`✅ Wallet created successfully!\n\n⚠️ Automatic SOL airdrop failed: ${lastAirdropError?.message}\n\n💰 You can get SOL manually from:\n• https://faucet.solana.com\n• https://solfaucet.com\n• Use the "Try Get SOL" button above`);
      } else {
        // Update balance after successful airdrop
        balance = await connection.getBalance(keypair.publicKey);
        console.log(`💰 New balance after airdrop: ${balance / LAMPORTS_PER_SOL} SOL`);
        setError('✅ Wallet created successfully! 0.1 SOL airdropped to your wallet.');
      }
    } else {
      setError(null);
    }

    console.log("🏦 Step 4: Creating token accounts...");
    // Create token accounts for common collections - non-blocking
    try {
      await createTokenAccountsForWallet(connection, keypair);
      console.log("✅ Token accounts process completed");
    } catch (tokenError) {
      console.log("⚠️ Token account creation had issues:", tokenError.message);
      // Don't fail wallet creation if token accounts fail
    }

    console.log("💾 Step 5: Setting up wallet state...");
    const newWallet = {
      publicKey: publicKey,
      secretKey: Array.from(keypair.secretKey),
      keypair: keypair,
      balance: balance / LAMPORTS_PER_SOL
    };
    
    setWallet(newWallet);
    setWalletBalance(balance / LAMPORTS_PER_SOL);
    setWalletSecretKey(JSON.stringify(Array.from(keypair.secretKey)));
    
    console.log('🎉 Step 6: Wallet creation complete!');
    
  } catch (err) {
    console.error('❌ Wallet creation failed:', err);
    
    // Provide specific error messages
    let errorMessage = 'Failed to create wallet: ' + err.message;
    
    if (err.message.includes('429') || err.message.includes('rate limit')) {
      errorMessage = `❌ Airdrop rate limit reached.\n\n💰 Please get test SOL from:\n• https://faucet.solana.com\n• https://solfaucet.com\n• Use the "Try Get SOL" button above\n\nQuick SOL Faucet Instructions:\n1. Copy your wallet address above\n2. Visit any of the faucet links\n3. Paste your address and request SOL\n4. Return here and refresh your balance`;
    } else if (err.message.includes('connection') || err.message.includes('network')) {
      errorMessage = 'Network connection failed. Please check your internet and try again.';
    } else if (err.message.includes('keypair') || err.message.includes('generat')) {
      errorMessage = 'Failed to generate wallet keys. Please try again.';
    }
    
    setError(errorMessage);
  } finally {
    setIsCreatingWallet(false);
  }
};

  // Download Wallet as JSON File
  const downloadWallet = () => {
    if (!wallet) return;

    try {
      // Create wallet data object
      const walletData = {
        publicKey: wallet.publicKey,
        secretKey: wallet.secretKey,
        network: 'devnet',
        createdAt: new Date().toISOString(),
        provider: 'Miko Timeline Wallet'
      };

      // Create blob and download link
      const blob = new Blob([JSON.stringify(walletData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `miko-wallet-${wallet.publicKey.slice(0, 8)}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Wallet downloaded successfully');
      
    } catch (err) {
      console.error('Wallet download failed:', err);
      setError('Failed to download wallet: ' + err.message);
    }
  };

  // Get Token - Mint and transfer to user's wallet
  const getToken = async () => {
    if (!wallet) {
      setError('Please connect your wallet first');
      return;
    }

    if (!mintParam) {
      setError('No collection found. Please provide a mint address via ?mint=<address>');
      return;
    }

    setMinting(true);
    setError(null);
    setMintResponse(null);

    try {
      // Prepare token data
      const tokenData = {
        userWallet: wallet.publicKey,
        collectionMint: mintParam,
        name: `Miko Token #${nftChain.length + 1}`,
        symbol: 'MIKO',
        description: `A unique token from the Miko collection - Generation ${nftChain.length + 1}`,
        collectionData: nftChain.length > 0 ? {
          previousMint: nftChain[nftChain.length - 1].mint,
          generation: nftChain.length + 1
        } : null
      };

      console.log('Minting token with data:', tokenData);

      // Call server to mint and transfer token
      const response = await fetch(`${API_URL}/mint-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setMintResponse(result);
        console.log('✅ Token minted and transferred successfully:', result.mint);
        
        // Refresh the NFT chain to show the new token
        setTimeout(() => {
          fetchNFTChain();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to mint token');
      }

    } catch (err) {
      console.error('Token minting failed:', err);
      setError(err.message);
    } finally {
      setMinting(false);
    }
  };

  // Restore Wallet from Secret Key
  const restoreWallet = () => {
    if (!walletSecretKey.trim()) {
      setError('Please enter a valid secret key');
      return;
    }

    try {
      const secretKeyArray = JSON.parse(walletSecretKey);
      const secretKey = Uint8Array.from(secretKeyArray);
      const keypair = Keypair.fromSecretKey(secretKey);
      
      const restoredWallet = {
        publicKey: keypair.publicKey.toString(),
        secretKey: Array.from(keypair.secretKey),
        keypair: keypair
      };
      
      setWallet(restoredWallet);
      setShowWalletModal(false);
      setWalletSecretKey('');
      setError(null);
      
      console.log('✅ Wallet restored:', restoredWallet.publicKey);
      
      // Fetch balance for restored wallet
      fetchWalletBalance(restoredWallet.publicKey);
      
      // Skip token account creation for restored wallet to avoid Buffer issues
      
    } catch (err) {
      console.error('Wallet restoration failed:', err);
      setError('Invalid secret key format');
    }
  };

  // Fetch Wallet Balance
  const fetchWalletBalance = async (publicKey) => {
    try {
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const balance = await connection.getBalance(new PublicKey(publicKey));
      setWalletBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  // Copy to Clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    setWallet(null);
    setWalletBalance(0);
    setWalletSecretKey('');
    setError(null);
  };

  // Load wallet from localStorage on component mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('mikoWallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setWallet(walletData);
        fetchWalletBalance(walletData.publicKey);
      } catch (err) {
        console.error('Failed to load saved wallet:', err);
        localStorage.removeItem('mikoWallet');
      }
    }
  }, []);

  // Save wallet to localStorage when it changes
  useEffect(() => {
    if (wallet) {
      localStorage.setItem('mikoWallet', JSON.stringify(wallet));
    } else {
      localStorage.removeItem('mikoWallet');
    }
  }, [wallet]);

  // Intersection Observer for scroll-based data display
  useEffect(() => {
    if (nftChain.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index'), 10);
            setSelectedNft(nftChain[index]);
          }
        });
      },
      {
        threshold: 0.6,
        rootMargin: '-100px 0px -100px 0px'
      }
    );

    nftRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [nftChain]);

  // Read query param ?mint=<address>
  const queryParams = new URLSearchParams(window.location.search);
  const mintParam = queryParams.get('mint');

  const fetchNFTChain = async () => {
    if (!mintParam) {
      setError('Please provide a mint address via ?mint=<address>');
      return;
    }
    setMint(mintParam);
    setLoading(true);

    try {
      const resp = await fetch(`${API_URL}/nft-chain?mint=${mintParam}`);
      if (!resp.ok) throw new Error(`Server responded with status ${resp.status}`);
      const data = await resp.json();
      
      if (data.success) {
        setNftChain(data.chain);
      } else {
        throw new Error(data.error || 'Failed to fetch NFT chain');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNFTChain();
  }, [mintParam, API_URL]);

  // Fix for error display - handle both string and JSX
  const renderError = () => {
    if (!error) return null;
    
    if (typeof error === 'string') {
      return (
        <div style={{ 
          background: mikoColors.surface,
          color: mikoColors.text,
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: `1px solid ${mikoColors.accent}30`,
          position: 'relative',
          zIndex: 3,
          whiteSpace: 'pre-line' // This will respect newlines in the string
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <div style={{ 
              color: mikoColors.accent,
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '8px' }}>
                Notice
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {error}
              </div>
              {error.includes('SOL') && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '10px',
                  background: mikoColors.background,
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <strong>Quick SOL Faucet Instructions:</strong><br/>
                  1. Copy your wallet address above<br/>
                  2. Visit any of the faucet links in the message<br/>
                  3. Paste your address and request SOL<br/>
                  4. Return here and refresh your balance
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // If error is not a string (shouldn't happen with our fix), render it as is
    return (
      <div style={{ 
        background: mikoColors.surface,
        color: mikoColors.text,
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '20px',
        border: `1px solid ${mikoColors.accent}30`,
        position: 'relative',
        zIndex: 3
      }}>
        {error}
      </div>
    );
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: mikoColors.background,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: mikoColors.text,
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* Static Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        opacity: 0.6
      }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${mikoColors.accent}20 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          top: '60%',
          right: '5%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${mikoColors.highlight}15 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />
        <div style={{
          position: 'absolute',
          top: '40%',
          left: '50%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${mikoColors.primary}30 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(30px)'
        }} />
      </div>

      {/* Main Content */}
      <div style={{ 
        padding: isMobile ? '20px 16px' : '40px 20px', 
        maxWidth: '1400px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}>
        
        {/* Header with Wallet Section */}
        <header style={{ 
          textAlign: 'center',
          marginBottom: isMobile ? '60px' : '100px',
          padding: isMobile ? '60px 20px' : '100px 40px',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            background: `radial-gradient(circle, ${mikoColors.accent}30 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(60px)',
            opacity: 0.7
          }} />
          
          <h1 style={{ 
            fontSize: isMobile ? '2.5rem' : '4rem', 
            fontWeight: '800', 
            marginBottom: '20px',
            background: `linear-gradient(135deg, ${mikoColors.text} 0%, ${mikoColors.highlight} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            position: 'relative'
          }}>
            Miko Timeline
          </h1>
          <p style={{ 
            fontSize: isMobile ? '1.1rem' : '1.4rem', 
            color: mikoColors.textSecondary,
            margin: '0 auto 40px',
            fontWeight: '300',
            maxWidth: '600px'
          }}>
            Explore the evolution of digital collectibles
          </p>

          {/* Wallet Section */}
          <div style={{
            background: mikoColors.surface,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            margin: '0 auto',
            border: `1px solid ${mikoColors.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            {!wallet ? (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  margin: '0 0 16px 0',
                  color: mikoColors.text,
                  fontSize: '1.2rem'
                }}>
                  Connect Your Wallet
                </h3>
                <p style={{ 
                  color: mikoColors.textSecondary,
                  marginBottom: '24px',
                  fontSize: '0.9rem'
                }}>
                  Create a new wallet or restore an existing one to get started
                </p>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={createNewWallet}
                    disabled={isCreatingWallet}
                    style={{
                      padding: '12px 24px',
                      background: `linear-gradient(135deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                      color: mikoColors.background,
                      border: 'none',
                      borderRadius: '8px',
                      cursor: isCreatingWallet ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isCreatingWallet ? 'Creating...' : 'Create New Wallet'}
                  </button>
                  
                  <button
                    onClick={() => setShowWalletModal(true)}
                    style={{
                      padding: '12px 24px',
                      background: 'transparent',
                      color: mikoColors.text,
                      border: `1px solid ${mikoColors.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Restore Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  margin: '0 0 16px 0',
                  color: mikoColors.text,
                  fontSize: '1.2rem'
                }}>
                  Your Wallet
                </h3>
                
                <div style={{
                  background: mikoColors.background,
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: `1px solid ${mikoColors.border}`
                }}>
                  <div style={{ 
                    fontSize: '12px',
                    color: mikoColors.textSecondary,
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}>
                    PUBLIC KEY
                  </div>
                  <div style={{ 
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    color: mikoColors.text,
                    marginBottom: '12px'
                  }}>
                    {wallet.publicKey}
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ fontSize: '14px', color: mikoColors.textSecondary }}>
                      Balance: <span style={{ color: mikoColors.success, fontWeight: '600' }}>
                        {walletBalance.toFixed(4)} SOL
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => copyToClipboard(wallet.publicKey)}
                        style={{
                          padding: '6px 12px',
                          background: mikoColors.primary,
                          color: mikoColors.text,
                          border: `1px solid ${mikoColors.border}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Copy
                      </button>
                      
                      <button
                        onClick={disconnectWallet}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: mikoColors.accent,
                          border: `1px solid ${mikoColors.accent}`,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                </div>

                {/* Download Wallet Button */}
                <button
                  onClick={downloadWallet}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: `linear-gradient(135deg, ${mikoColors.success}, ${mikoColors.highlight})`,
                    color: mikoColors.background,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: '12px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download Wallet Backup
                </button>
                
                <div style={{ 
                  fontSize: '11px',
                  color: mikoColors.textSecondary,
                  textAlign: 'left',
                  background: mikoColors.background,
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${mikoColors.warning}30`
                }}>
                  ⚠️ Save your wallet backup file securely. This contains your private keys and is required to restore your wallet.
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Restore Wallet Modal */}
        {showWalletModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: mikoColors.surface,
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
              border: `1px solid ${mikoColors.border}`,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
            }}>
              <h3 style={{ 
                margin: '0 0 16px 0',
                color: mikoColors.text,
                fontSize: '1.3rem'
              }}>
                Restore Wallet
              </h3>
              
              <p style={{ 
                color: mikoColors.textSecondary,
                marginBottom: '20px',
                fontSize: '0.9rem'
              }}>
                Paste your secret key array to restore your wallet, or upload a wallet backup file
              </p>

              {/* File Upload Option */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500', 
                  color: mikoColors.text,
                  fontSize: '14px'
                }}>
                  Upload Wallet Backup File
                </label>
                <input 
                  type="file" 
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const walletData = JSON.parse(event.target.result);
                          if (walletData.secretKey && walletData.publicKey) {
                            setWalletSecretKey(JSON.stringify(walletData.secretKey));
                          } else {
                            setError('Invalid wallet file format');
                          }
                        } catch (err) {
                          setError('Failed to read wallet file');
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  style={{ 
                    padding: '12px',
                    border: `1px solid ${mikoColors.border}`,
                    borderRadius: '8px',
                    width: '100%',
                    background: mikoColors.background,
                    color: mikoColors.text,
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ textAlign: 'center', marginBottom: '16px', color: mikoColors.textSecondary }}>
                or
              </div>
              
              <textarea
                value={walletSecretKey}
                onChange={(e) => setWalletSecretKey(e.target.value)}
                placeholder='Paste secret key array (e.g., [123, 45, 67, ...])'
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  background: mikoColors.background,
                  border: `1px solid ${mikoColors.border}`,
                  borderRadius: '8px',
                  color: mikoColors.text,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  marginBottom: '20px'
                }}
              />
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowWalletModal(false);
                    setWalletSecretKey('');
                    setError(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    color: mikoColors.textSecondary,
                    border: `1px solid ${mikoColors.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={restoreWallet}
                  disabled={!walletSecretKey.trim()}
                  style={{
                    padding: '10px 20px',
                    background: walletSecretKey.trim() ? mikoColors.accent : mikoColors.border,
                    color: mikoColors.background,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: walletSecretKey.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  Restore Wallet
                </button>
              </div>
              
              {error && (
                <div style={{
                  color: mikoColors.accent,
                  fontSize: '12px',
                  marginTop: '12px',
                  padding: '8px',
                  background: mikoColors.background,
                  borderRadius: '4px',
                  border: `1px solid ${mikoColors.accent}30`
                }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Display - FIXED */}
        {renderError()}

        {/* Loading State */}
        {loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            background: mikoColors.surface,
            borderRadius: '20px',
            marginBottom: '60px',
            border: `1px solid ${mikoColors.border}`,
            position: 'relative',
            zIndex: 3
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: `3px solid ${mikoColors.border}`,
              borderTop: `3px solid ${mikoColors.accent}`,
              borderRadius: '50%',
              margin: '0 auto 30px',
              animation: 'spin 1.5s linear infinite'
            }} />
            <p style={{ 
              margin: 0, 
              color: mikoColors.textSecondary,
              fontSize: '1.1rem',
              fontWeight: '500'
            }}>
              Loading Timeline...
            </p>
          </div>
        )}

        {/* NFT Timeline without Parallax */}
        {nftChain.length > 0 && (
          <section 
            ref={timelineRef}
            style={{ 
              marginBottom: '100px',
              position: 'relative',
              minHeight: '500px'
            }}
          >
            <div style={{
              textAlign: 'center',
              marginBottom: '80px',
              position: 'relative',
              zIndex: 3
            }}>
              <h2 style={{ 
                fontSize: isMobile ? '1.8rem' : '2.5rem', 
                fontWeight: '700',
                color: mikoColors.text,
                marginBottom: '16px'
              }}>
                Collection Journey
              </h2>
              <div style={{
                height: '4px',
                width: '120px',
                background: `linear-gradient(90deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                margin: '0 auto',
                borderRadius: '2px'
              }} />
            </div>

            {/* Timeline Center Line */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              bottom: '0',
              width: '2px',
              background: `linear-gradient(to bottom, transparent, ${mikoColors.accent}, ${mikoColors.highlight}, transparent)`,
              transform: 'translateX(-50%)',
              zIndex: 1
            }} />

            {/* NFT Timeline Items */}
            <div style={{
              position: 'relative',
              zIndex: 2
            }}>
              {nftChain.map((nft, index) => {
                const isEven = index % 2 === 0;
                const isFirst = index === 0;
                const isLast = index === nftChain.length - 1;
                const isSelected = selectedNft?.mint === nft.mint;

                return (
                  <div
                    key={nft.mint}
                    ref={el => nftRefs.current[index] = el}
                    data-index={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isEven ? 'flex-start' : 'flex-end',
                      marginBottom: '80px',
                      position: 'relative'
                    }}
                  >
                    {/* Connection Line */}
                    <div style={{
                      position: 'absolute',
                      left: isEven ? 'calc(50% + 1px)' : '50%',
                      right: isEven ? 'auto' : 'calc(50% + 1px)',
                      top: '50%',
                      height: '2px',
                      background: `linear-gradient(to ${isEven ? 'right' : 'left'}, ${mikoColors.primary}, ${mikoColors.border})`,
                      zIndex: 2,
                      transform: 'translateY(-50%)'
                    }} />

                    {/* NFT Card */}
                    <div style={{
                      width: isMobile ? '85%' : '42%',
                      background: mikoColors.surface,
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: isSelected 
                        ? `0 20px 60px ${mikoColors.accent}20, 0 8px 32px rgba(0,0,0,0.4)` 
                        : '0 8px 32px rgba(0,0,0,0.3)',
                      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                      transform: isSelected ? 'scale(1.02) translateY(-5px)' : 'scale(1)',
                      border: `1px solid ${isSelected ? mikoColors.accent : mikoColors.border}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Active Border Effect */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                        transform: isSelected ? 'scaleX(1)' : 'scaleX(0)',
                        transition: 'transform 0.4s ease',
                        transformOrigin: 'left'
                      }} />

                      {/* NFT Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '20px',
                        gap: '16px'
                      }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '12px',
                          background: `linear-gradient(135deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: mikoColors.background,
                          fontWeight: 'bold',
                          fontSize: '16px',
                          flexShrink: 0
                        }}>
                          #{index + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: mikoColors.text,
                            margin: '0 0 6px 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {nft.name || 'Unnamed NFT'}
                          </h3>
                          <p style={{
                            color: mikoColors.textSecondary,
                            fontSize: '13px',
                            fontWeight: '600',
                            margin: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Generation {index + 1}
                          </p>
                        </div>
                      </div>

                      {/* NFT Image */}
                      {nft.image && (
                        <div style={{
                          borderRadius: '12px',
                          overflow: 'hidden',
                          marginBottom: '20px',
                          position: 'relative',
                          background: mikoColors.background,
                          aspectRatio: '1'
                        }}>
                          <img 
                            src={nft.image} 
                            alt={nft.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.4s ease'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.style.background = mikoColors.background;
                              e.target.parentElement.style.display = 'flex';
                              e.target.parentElement.style.alignItems = 'center';
                              e.target.parentElement.style.justifyContent = 'center';
                              e.target.parentElement.innerHTML = `<div style="color: ${mikoColors.textSecondary}; font-size: 14px;">No Image</div>`;
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: isFirst ? mikoColors.highlight : 
                                       isLast ? mikoColors.accent : mikoColors.primary,
                            color: mikoColors.background,
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {isFirst ? 'START' : isLast ? 'LATEST' : `STEP ${index + 1}`}
                          </div>
                        </div>
                      )}

                      {/* Additional Data Panel - Shows based on scroll position */}
                      {isSelected && nft.secondFileData && (
                        <div style={{
                          background: mikoColors.lightSurface,
                          padding: '20px',
                          borderRadius: '12px',
                          marginBottom: '20px',
                          border: `1px solid ${mikoColors.border}`,
                          animation: 'slideDown 0.3s ease-out'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '15px',
                            color: mikoColors.text,
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span style={{ color: mikoColors.accent }}>●</span>
                            Collection Data
                          </h4>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                            gap: '12px',
                            fontSize: '13px'
                          }}>
                            {Object.entries(nft.secondFileData).map(([key, value]) => (
                              <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ 
                                  fontWeight: '600', 
                                  color: mikoColors.textSecondary,
                                  textTransform: 'capitalize',
                                  fontSize: '12px',
                                  marginBottom: '4px'
                                }}>
                                  {key.replace(/([A-Z])/g, ' $1')}:
                                </span>
                                <span style={{ 
                                  color: mikoColors.text,
                                  wordBreak: 'break-word'
                                }}>
                                  {Array.isArray(value) ? value.join(', ') : value.toString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* NFT Actions */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '10px'
                      }}>
                        <a 
                          href={nft.explorerLink}
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            padding: '12px 16px',
                            background: mikoColors.primary,
                            color: mikoColors.text,
                            textDecoration: 'none',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            border: `1px solid ${mikoColors.border}`
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = mikoColors.accent;
                            e.target.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = mikoColors.primary;
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          View Details
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(nft.mint);
                          }}
                          style={{
                            padding: '12px 16px',
                            background: 'transparent',
                            border: `1px solid ${mikoColors.border}`,
                            borderRadius: '10px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: mikoColors.textSecondary,
                            fontWeight: '600',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = mikoColors.lightSurface;
                            e.target.style.color = mikoColors.text;
                            e.target.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'transparent';
                            e.target.style.color = mikoColors.textSecondary;
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Get Token Button Section */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '80px',
                position: 'relative'
              }}>
                {/* Connection Line for Get Token */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  right: 'calc(50% + 1px)',
                  top: '50%',
                  height: '2px',
                  background: `linear-gradient(to left, ${mikoColors.primary}, ${mikoColors.border})`,
                  zIndex: 2,
                  transform: 'translateY(-50%)'
                }} />

                {/* Get Token Button */}
                <div style={{
                  width: isMobile ? '85%' : '42%',
                  background: mikoColors.surface,
                  borderRadius: '16px',
                  padding: '40px 30px',
                  border: `2px solid ${mikoColors.highlight}30`,
                  position: 'relative',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.4s ease'
                }}>
                  <div style={{
                    marginBottom: '24px'
                  }}>
                    <h3 style={{ 
                      fontSize: isMobile ? '1.4rem' : '1.8rem', 
                      fontWeight: '700',
                      color: mikoColors.text,
                      marginBottom: '12px'
                    }}>
                      Get Your Token
                    </h3>
                    <p style={{ 
                      color: mikoColors.textSecondary,
                      fontSize: '1rem',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      Mint a new token from this collection and have it transferred directly to your wallet
                    </p>
                  </div>

                  <button 
                    onClick={getToken}
                    disabled={minting || !wallet}
                    style={{ 
                      padding: '16px 32px', 
                      background: minting ? mikoColors.border : 
                                 !wallet ? mikoColors.secondary : 
                                 `linear-gradient(135deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                      color: mikoColors.background,
                      border: 'none',
                      borderRadius: '12px',
                      cursor: (minting || !wallet) ? 'not-allowed' : 'pointer',
                      fontSize: '18px',
                      fontWeight: '700',
                      width: '100%',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!minting && wallet) {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = `0 8px 25px ${mikoColors.accent}40`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!minting && wallet) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {minting ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: `2px solid transparent`,
                          borderTop: `2px solid ${mikoColors.background}`,
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        Minting Your Token...
                      </div>
                    ) : !wallet ? (
                      'Connect Wallet to Get Token'
                    ) : (
                      'Get Your Token Now'
                    )}
                  </button>

                  {!wallet && (
                    <p style={{ 
                      color: mikoColors.textSecondary,
                      fontSize: '14px',
                      marginTop: '16px',
                      fontStyle: 'italic'
                    }}>
                      You need to connect your wallet to receive the token
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Success Message */}
        {mintResponse && (
          <section style={{ 
            background: mikoColors.surface,
            padding: '40px',
            borderRadius: '16px',
            border: `1px solid ${mikoColors.highlight}30`,
            textAlign: 'center',
            position: 'relative',
            zIndex: 3,
            marginTop: '40px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: `linear-gradient(135deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 'bold',
              color: mikoColors.background
            }}>
              ✓
            </div>
            <h3 style={{ 
              color: mikoColors.text, 
              margin: '0 0 16px 0',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              Token Successfully Minted!
            </h3>
            <p style={{
              color: mikoColors.textSecondary,
              marginBottom: '24px',
              fontSize: '1rem'
            }}>
              Your new token has been minted and transferred to your wallet.
            </p>
            
            <div style={{ 
              background: mikoColors.background,
              padding: '16px',
              borderRadius: '10px',
              marginBottom: '24px',
              border: `1px solid ${mikoColors.border}`
            }}>
              <div style={{ 
                fontSize: '13px',
                color: mikoColors.textSecondary,
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Token Address
              </div>
              <div style={{ 
                fontSize: '14px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: mikoColors.text
              }}>
                {mintResponse.token.mint}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {mintResponse.explorerLink && (
                <a 
                  href={mintResponse.explorerLink}
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 20px',
                    background: mikoColors.primary,
                    color: mikoColors.text,
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    border: `1px solid ${mikoColors.border}`
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = mikoColors.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = mikoColors.primary;
                  }}
                >
                  View Transaction
                </a>
              )}
              <a 
                href={`/?mint=${mintResponse.token.mint}`}
                style={{
                  padding: '12px 20px',
                  background: `linear-gradient(135deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                  color: mikoColors.background,
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                View in Timeline
              </a>
              <button
                onClick={() => setMintResponse(null)}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  color: mikoColors.textSecondary,
                  border: `1px solid ${mikoColors.border}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }}
              >
                Close
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Global Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes slideDown {
            from { 
              opacity: 0; 
              transform: translateY(-10px); 
              max-height: 0;
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
              max-height: 500px;
            }
          }
          
          * {
            -webkit-tap-highlight-color: transparent;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            background: ${mikoColors.background};
            overflow-x: hidden;
          }
        `}
      </style>
    </div>
  );
}

export default App;