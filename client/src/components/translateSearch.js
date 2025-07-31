/**
 * Language search functionality for Google Translate widget
 * This script adds a search box to the Google Translate dropdown menu
 * to help users find languages more easily.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Function to observe for Google Translate menu to appear
  const observeForTranslateMenu = () => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node instanceof HTMLIFrameElement && node.classList.contains('goog-te-menu-frame')) {
              enhanceTranslateMenu(node);
              break;
            }
          }
        }
      }
    });
    
    // Start observing for Google Translate menu to appear
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
  };
  
  // Add a search box to the Google Translate dropdown
  const enhanceTranslateMenu = (iframe) => {
    try {
      // Access the iframe content
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      
      // Wait for iframe content to be ready
      setTimeout(() => {
        // Create search box container
        const searchContainer = document.createElement('div');
        searchContainer.style.padding = '8px 16px';
        searchContainer.style.position = 'sticky';
        searchContainer.style.top = '0';
        searchContainer.style.backgroundColor = '#ffffff';
        searchContainer.style.borderBottom = '1px solid #e5e7eb';
        searchContainer.style.zIndex = '10';
        
        // Create search input
        const searchInput = document.createElement('input');
        searchInput.setAttribute('type', 'text');
        searchInput.setAttribute('placeholder', 'Search languages...');
        searchInput.style.width = '100%';
        searchInput.style.padding = '8px 12px';
        searchInput.style.border = '1px solid #e2e8f0';
        searchInput.style.borderRadius = '4px';
        searchInput.style.fontSize = '13px';
        searchInput.style.outline = 'none';
        
        // Add search input to container
        searchContainer.appendChild(searchInput);
        
        // Find the menu table and add the search box before it
        const menuTable = iframeDoc.querySelector('.goog-te-menu2-item').closest('table');
        if (menuTable) {
          menuTable.parentNode.insertBefore(searchContainer, menuTable);
          
          // Add search functionality
          searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const menuItems = iframeDoc.querySelectorAll('.goog-te-menu2-item');
            
            menuItems.forEach((item) => {
              const languageName = item.textContent.toLowerCase();
              if (languageName.includes(searchTerm)) {
                item.style.display = '';
              } else {
                item.style.display = 'none';
              }
            });
          });
          
          // Focus the search input
          searchInput.focus();
        }
        
        // Apply dark mode styles if needed
        if (document.documentElement.classList.contains('dark')) {
          searchContainer.style.backgroundColor = '#1f2937';
          searchContainer.style.borderColor = '#4b5563';
          searchInput.style.backgroundColor = '#374151';
          searchInput.style.borderColor = '#4b5563';
          searchInput.style.color = '#f9fafb';
        }
      }, 100);
    } catch (error) {
      console.error('Error enhancing Google Translate menu:', error);
    }
  };
  
  // Initialize the observer
  observeForTranslateMenu();
});
