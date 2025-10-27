import React, { useEffect, useState, useRef } from 'react';

function App() {
  const [mint, setMint] = useState(null);
  const [nftChain, setNftChain] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  const [imageFile, setImageFile] = useState(null);
  const [extraFile, setExtraFile] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [uploading, setUploading] = useState(false);

  const timelineRef = useRef(null);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Get API URL from environment variable with fallback for development
  const API_URL = process.env.REACT_APP_HOST || 'http://localhost:3000';

  // Enhanced Miko color palette
  const mikoColors = {
    primary: '#2A2D43',     // Sophisticated dark blue
    secondary: '#4A4E69',   // Medium blue
    accent: '#F25F5C',      // Miko coral
    highlight: '#FFE74C',   // Miko yellow
    background: '#1A1C2B',  // Deep background
    surface: '#2D3047',     // Card surface
    lightSurface: '#3A3E5B', // Hover state
    text: '#FFFFFF',
    textSecondary: '#B8BBD5',
    border: '#3A3E5B'
  };

  // Smooth parallax scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    let ticking = false;
    const updateScroll = () => {
      handleScroll();
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Read query param ?mint=<address>
  const queryParams = new URLSearchParams(window.location.search);
  const mintParam = queryParams.get('mint');

  useEffect(() => {
    if (!mintParam) {
      setError('Please provide a mint address via ?mint=<address>');
      return;
    }
    setMint(mintParam);

    const fetchNFTChain = async () => {
      setLoading(true);
      try {
        // Use environment variable for API URL
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

    fetchNFTChain();
  }, [mintParam, API_URL]);

  // Upload files and mint NFT
  const handleUpload = async () => {
    if (!imageFile) return alert("Image file is required");
    setUploading(true);
    setUploadResponse(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("name", "Miko NFT");
      formData.append("symbol", "MIKO");
      formData.append("description", "Miko collection NFT");
      formData.append("prev", mintParam);
      formData.append("collection_id", "MK_43");
      if (extraFile) formData.append("extraFile", extraFile);

      // Use environment variable for API URL
      const resp = await fetch(`${API_URL}/upload-and-mint`, {
        method: "POST",
        body: formData
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || `Server error: ${resp.status}`);
      }

      const data = await resp.json();
      setUploadResponse(data);
      
      console.log("NFT minted successfully:", data.mint);
      
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Improved parallax effect for timeline
  const getParallaxOffset = (index) => {
    const speed = 0.15;
    const elementOffset = index * 50;
    return (scrollY * speed) - elementOffset;
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
      
      {/* Subtle Parallax Background Elements */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        opacity: 0.6
      }}>
        {/* Moving background shapes with parallax */}
        <div style={{
          position: 'absolute',
          top: `${20 + scrollY * 0.05}%`,
          left: '10%',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${mikoColors.accent}20 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          top: `${60 - scrollY * 0.03}%`,
          right: '5%',
          width: '400px',
          height: '400px',
          background: `radial-gradient(circle, ${mikoColors.highlight}15 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(50px)'
        }} />
        <div style={{
          position: 'absolute',
          top: `${40 + scrollY * 0.02}%`,
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
        
        {/* Header */}
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
            margin: 0,
            fontWeight: '300',
            maxWidth: '600px',
            margin: '0 auto',
            position: 'relative'
          }}>
            Explore the evolution of digital collectibles
          </p>
        </header>

        {/* Error Display */}
        {error && (
          <div style={{ 
            background: mikoColors.surface,
            color: mikoColors.accent,
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '40px',
            border: `1px solid ${mikoColors.accent}30`,
            position: 'relative',
            zIndex: 3
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

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

        {/* NFT Timeline with Parallax */}
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
                const parallaxOffset = getParallaxOffset(index);
                const isFirst = index === 0;
                const isLast = index === nftChain.length - 1;

                return (
                  <div
                    key={nft.mint}
                    onMouseEnter={() => setSelectedNft(nft)}
                    onMouseLeave={() => setSelectedNft(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: isEven ? 'flex-start' : 'flex-end',
                      marginBottom: '80px',
                      position: 'relative',
                      cursor: 'pointer',
                      transform: `translateY(${parallaxOffset}px)`,
                      transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
                    }}
                  >
                    {/* Timeline Dot with Connection */}
                    <div style={{
                      position: 'absolute',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: isFirst ? mikoColors.highlight : 
                                 isLast ? mikoColors.accent : mikoColors.primary,
                      border: `4px solid ${mikoColors.background}`,
                      boxShadow: `0 0 0 2px ${isFirst ? mikoColors.highlight : isLast ? mikoColors.accent : mikoColors.primary}`,
                      zIndex: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: mikoColors.background
                    }}>
                      {isFirst ? 'S' : isLast ? 'L' : index + 1}
                    </div>

                    {/* Connection Line from Dot to Card */}
                    <div style={{
                      position: 'absolute',
                      left: isEven ? 'calc(50% + 12px)' : '50%',
                      right: isEven ? 'auto' : 'calc(50% + 12px)',
                      top: '12px',
                      height: '2px',
                      background: `linear-gradient(to ${isEven ? 'right' : 'left'}, ${mikoColors.primary}, ${mikoColors.border})`,
                      zIndex: 2
                    }} />

                    {/* NFT Card with Hover Effects */}
                    <div style={{
                      width: isMobile ? '85%' : '42%',
                      background: mikoColors.surface,
                      borderRadius: '16px',
                      padding: '24px',
                      boxShadow: selectedNft?.mint === nft.mint 
                        ? `0 20px 60px ${mikoColors.accent}20, 0 8px 32px rgba(0,0,0,0.4)` 
                        : '0 8px 32px rgba(0,0,0,0.3)',
                      transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)',
                      transform: selectedNft?.mint === nft.mint ? 'scale(1.02) translateY(-5px)' : 'scale(1)',
                      border: `1px solid ${selectedNft?.mint === nft.mint ? mikoColors.accent : mikoColors.border}`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Hover Border Effect */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: `linear-gradient(90deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                        transform: selectedNft?.mint === nft.mint ? 'scaleX(1)' : 'scaleX(0)',
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

                      {/* Additional Data Panel - Shows on Hover */}
                      {selectedNft?.mint === nft.mint && nft.secondFileData && (
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

              {/* Integrated Upload Section as part of the timeline */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '80px',
                position: 'relative',
                transform: `translateY(${getParallaxOffset(nftChain.length)}px)`,
                transition: 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)'
              }}>
                {/* Timeline Dot for Upload */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: mikoColors.highlight,
                  border: `4px solid ${mikoColors.background}`,
                  boxShadow: `0 0 0 2px ${mikoColors.highlight}`,
                  zIndex: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: mikoColors.background
                }}>
                  +
                </div>

                {/* Upload Card - Subtle and Integrated */}
                <div style={{
                  width: isMobile ? '85%' : '42%',
                  background: `${mikoColors.surface}80`,
                  borderRadius: '16px',
                  padding: '30px',
                  border: `2px dashed ${mikoColors.border}`,
                  position: 'relative',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.4s ease'
                }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '30px'
                  }}>
                    <h3 style={{ 
                      fontSize: isMobile ? '1.3rem' : '1.6rem', 
                      fontWeight: '600',
                      color: mikoColors.text,
                      marginBottom: '8px'
                    }}>
                      Continue the Journey
                    </h3>
                    <p style={{ 
                      color: mikoColors.textSecondary,
                      fontSize: '0.95rem',
                      margin: 0
                    }}>
                      Add the next piece to the timeline
                    </p>
                  </div>

                  {/* File Inputs - Compact */}
                  <div style={{
                    display: 'grid',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '500', 
                        color: mikoColors.text,
                        fontSize: '14px'
                      }}>
                        Image File
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={e => setImageFile(e.target.files[0])}
                        style={{ 
                          padding: '12px',
                          border: `1px solid ${mikoColors.border}`,
                          borderRadius: '8px',
                          width: '100%',
                          background: mikoColors.background,
                          color: mikoColors.text,
                          fontSize: '14px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = mikoColors.accent}
                        onBlur={(e) => e.target.style.borderColor = mikoColors.border}
                      />
                      {imageFile && (
                        <div style={{ 
                          color: mikoColors.accent, 
                          marginTop: '6px', 
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          Selected: {imageFile.name}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '8px', 
                        fontWeight: '500', 
                        color: mikoColors.text,
                        fontSize: '14px'
                      }}>
                        Additional Data (Optional)
                      </label>
                      <input 
                        type="file" 
                        onChange={e => setExtraFile(e.target.files[0])}
                        style={{ 
                          padding: '12px',
                          border: `1px solid ${mikoColors.border}`,
                          borderRadius: '8px',
                          width: '100%',
                          background: mikoColors.background,
                          color: mikoColors.text,
                          fontSize: '14px',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = mikoColors.highlight}
                        onBlur={(e) => e.target.style.borderColor = mikoColors.border}
                      />
                      {extraFile && (
                        <div style={{ 
                          color: mikoColors.highlight, 
                          marginTop: '6px', 
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          Selected: {extraFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Upload Button */}
                  <button 
                    onClick={handleUpload} 
                    disabled={uploading || !imageFile}
                    style={{ 
                      padding: '14px 24px', 
                      background: uploading ? mikoColors.border : `linear-gradient(135deg, ${mikoColors.accent}, ${mikoColors.highlight})`,
                      color: mikoColors.background,
                      border: 'none',
                      borderRadius: '10px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '600',
                      width: '100%',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => !uploading && (e.target.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => !uploading && (e.target.style.transform = 'translateY(0)')}
                  >
                    {uploading ? 'Creating...' : 'Add to Timeline'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Success Message */}
        {uploadResponse && (
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
              Collectible Created!
            </h3>
            
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
                Mint Address
              </div>
              <div style={{ 
                fontSize: '14px',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                color: mikoColors.text
              }}>
                {uploadResponse.mint}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center'
            }}>
              <a 
                href={uploadResponse.explorerLink}
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
              <a 
                href={`/?mint=${uploadResponse.mint}`}
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