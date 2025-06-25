// Dashboard Testing Utilities
// This file contains helper functions for testing dashboard functionality

export const testScenarios = {
  // Test 1: Dashboard Load
  dashboardLoad: async () => {
    console.log('🧪 Testing Dashboard Load...');
    const startTime = performance.now();

    // Check if all statistics load with real data
    const statsCards = document.querySelectorAll('[data-testid="stats-card"]');
    const loadTime = performance.now() - startTime;

    console.log(`✅ Dashboard loaded in ${loadTime.toFixed(2)}ms`);
    console.log(`📊 Found ${statsCards.length} statistics cards`);

    return {
      success: true,
      loadTime,
      statsCount: statsCards.length
    };
  },

  // Test 2: New Order Notification
  newOrderNotification: () => {
    console.log('🧪 Testing New Order Notification...');

    const notificationBanner = document.querySelector('[data-testid="notification-banner"]');
    const pulseAnimation = notificationBanner?.classList.contains('notification-pulse');

    console.log(`🔔 Notification banner: ${notificationBanner ? 'Found' : 'Not found'}`);
    console.log(`✨ Pulse animation: ${pulseAnimation ? 'Active' : 'Inactive'}`);

    return {
      success: !!notificationBanner,
      hasAnimation: !!pulseAnimation
    };
  },

  // Test 3: Mobile Experience
  mobileExperience: () => {
    console.log('🧪 Testing Mobile Experience...');

    const mobileButtons = document.querySelectorAll('.mobile-button');
    const touchTargets = document.querySelectorAll('.touch-target');
    const invalidButtons = Array.from(mobileButtons).filter(btn => {
      const rect = btn.getBoundingClientRect();
      return rect.height < 44 || rect.width < 44;
    });

    console.log(`📱 Mobile buttons: ${mobileButtons.length}`);
    console.log(`👆 Touch targets: ${touchTargets.length}`);
    console.log(`❌ Invalid touch targets: ${invalidButtons.length}`);

    return {
      success: invalidButtons.length === 0,
      mobileButtonsCount: mobileButtons.length,
      touchTargetsCount: touchTargets.length,
      invalidButtonsCount: invalidButtons.length
    };
  },

  // Test 4: Real-time Updates
  realTimeUpdates: (callback: (result: any) => void) => {
    console.log('🧪 Testing Real-time Updates...');

    let updateCount = 0;
    const startTime = Date.now();

    // Monitor DOM changes for statistics updates
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          updateCount++;
        }
      });
    });

    const statsContainer = document.querySelector('[data-testid="stats-container"]');
    if (statsContainer) {
      observer.observe(statsContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }

    // Test for 5 seconds
    setTimeout(() => {
      observer.disconnect();
      const duration = Date.now() - startTime;

      console.log(`🔄 Updates detected: ${updateCount} in ${duration}ms`);

      callback({
        success: updateCount > 0,
        updateCount,
        duration
      });
    }, 5000);
  },

  // Test 5: Animation Performance
  animationPerformance: () => {
    console.log('🧪 Testing Animation Performance...');

    const animatedElements = document.querySelectorAll('.notification-pulse, .count-up, .table-status-transition');
    let performanceIssues = 0;

    animatedElements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const willChange = computedStyle.willChange;
      const transform = computedStyle.transform;

      // Check for performance optimizations
      if (willChange === 'auto' && transform !== 'none') {
        performanceIssues++;
      }
    });

    console.log(`🎨 Animated elements: ${animatedElements.length}`);
    console.log(`⚠️ Performance issues: ${performanceIssues}`);

    return {
      success: performanceIssues === 0,
      animatedElementsCount: animatedElements.length,
      performanceIssues
    };
  }
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Starting Dashboard Tests...');

  const results = {
    dashboardLoad: await testScenarios.dashboardLoad(),
    newOrderNotification: testScenarios.newOrderNotification(),
    mobileExperience: testScenarios.mobileExperience(),
    animationPerformance: testScenarios.animationPerformance()
  };

  // Real-time updates test (async)
  testScenarios.realTimeUpdates((realTimeResult) => {
    results.realTimeUpdates = realTimeResult;
    console.log('📊 All Tests Complete:', results);
  });

  return results;
};

// Development helper to add test attributes
export const addTestAttributes = () => {
  if (process.env.NODE_ENV !== 'development') return;

  // Add test IDs to elements
  const statsCards = document.querySelectorAll('[class*="AnimatedStatsCard"]');
  statsCards.forEach((card, index) => {
    card.setAttribute('data-testid', `stats-card-${index}`);
  });

  const notificationBanner = document.querySelector('[class*="AnimatedNotificationBanner"]');
  if (notificationBanner) {
    notificationBanner.setAttribute('data-testid', 'notification-banner');
  }

  const statsContainer = document.querySelector('[class*="stats-container"]');
  if (statsContainer) {
    statsContainer.setAttribute('data-testid', 'stats-container');
  }
};

// Performance monitoring
export const monitorPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Monitor animation frames
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        console.log(`🎯 FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);
  }
};
