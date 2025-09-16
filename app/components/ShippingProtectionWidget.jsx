//app/component/ShippingProtectionWidget.jsx


import React, { useState, useEffect } from 'react';

const ShippingProtectionWidget = ({ shop, cartTotal = 0 }) => {
  const [widgetData, setWidgetData] = useState(null);
  const [isProtectionSelected, setIsProtectionSelected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWidgetData();
  }, [shop]);

  const fetchWidgetData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/app/cartWidget?shop=${encodeURIComponent(shop)}`);
      const data = await response.json();
      
      if (data.success) {
        setWidgetData(data.widget);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load shipping protection widget');
      console.error('Widget fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProtectionPrice = () => {
    if (!widgetData) return 0;
    
    const pricingOptions = widgetData.selectedPricingOptions || [];
    const pricingValue = parseFloat(widgetData.pricingValue) || 0;
    
    if (pricingOptions.includes('percentage')) {
      return (cartTotal * pricingValue / 100).toFixed(2);
    } else if (pricingOptions.includes('fixed')) {
      return pricingValue.toFixed(2);
    }
    
    return parseFloat(widgetData.price).toFixed(2);
  };

  const handleToggleProtection = () => {
    setIsProtectionSelected(!isProtectionSelected);
    
    // Here you would typically add/remove the protection product from cart
    // This depends on your Shopify setup and cart management
    const protectionPrice = calculateProtectionPrice();
    
    if (!isProtectionSelected) {
      // Add protection to cart
      console.log('Adding protection to cart:', {
        variantId: widgetData.variantId,
        price: protectionPrice,
        title: widgetData.title
      });
      // Call your cart API to add the protection product
    } else {
      // Remove protection from cart
      console.log('Removing protection from cart');
      // Call your cart API to remove the protection product
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <div>Loading shipping protection...</div>
      </div>
    );
  }

  if (error || !widgetData) {
    return null; // Don't show widget if there's an error or no data
  }

  const colorStates = widgetData.colorStates || {};
  const showIcon = widgetData.selectedVisiblityOptions?.includes('show');
  const useSwitch = widgetData.selectedButtonOptions?.includes('switch');
  const protectionPrice = calculateProtectionPrice();

  const widgetStyles = {
    border: widgetData.widgetBorderSize ? `${widgetData.widgetBorderSize}px solid ${colorStates.borderColor || '#e7e7e7'}` : 'none',
    borderRadius: `${widgetData.widgetCornerRadius || 0}px`,
    backgroundColor: colorStates.backgroundColor || '#ffffff',
    padding: `${widgetData.widgetVerticalPadding || 16}px ${widgetData.widgetHorizontalPadding || 16}px`,
    margin: '16px 0',
  };

  const iconStyles = {
    width: `${widgetData.iconSize || 40}px`,
    height: `${widgetData.iconSize || 40}px`,
    borderRadius: `${widgetData.iconCornerRadius || 0}px`,
  };

  return (
    <div style={widgetStyles} className="shipping-protection-widget">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {showIcon && (
          <div style={{ flexShrink: 0 }}>
            <img 
              src={widgetData.imageUrl} 
              alt={widgetData.title}
              style={iconStyles}
            />
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ 
              margin: 0, 
              color: colorStates.titleColor || '#000000',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              {widgetData.title}
            </h4>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: '600',
                color: colorStates.titleColor || '#000000'
              }}>
                ₹{protectionPrice}
              </span>
              
              {useSwitch ? (
                <label style={{ 
                  position: 'relative', 
                  display: 'inline-block', 
                  width: '44px', 
                  height: '24px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={isProtectionSelected}
                    onChange={handleToggleProtection}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isProtectionSelected ? (colorStates.optInActionColor || '#cc62c7') : (colorStates.optOutActionColor || '#e7e7e7'),
                    borderRadius: '24px',
                    transition: '0.3s',
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '18px',
                      width: '18px',
                      left: isProtectionSelected ? '23px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                    }} />
                  </span>
                </label>
              ) : (
                <input
                  type="checkbox"
                  checked={isProtectionSelected}
                  onChange={handleToggleProtection}
                  style={{ 
                    width: '18px', 
                    height: '18px',
                    accentColor: colorStates.optInActionColor || '#cc62c7'
                  }}
                />
              )}
            </div>
          </div>
          
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            lineHeight: '1.4',
            color: isProtectionSelected 
              ? (colorStates.enableDescColor || '#282828')
              : (colorStates.disabledDescColor || '#282828')
          }}>
            {isProtectionSelected 
              ? widgetData.description 
              : (widgetData.disabledDescription || widgetData.description)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingProtectionWidget;