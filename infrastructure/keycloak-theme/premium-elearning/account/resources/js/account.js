/**
 * Premium E-Learning Theme - Account Console JavaScript
 */

(function() {
    'use strict';

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeAccountTheme();
    });

    function initializeAccountTheme() {
        console.log('Premium E-Learning Account Theme initialized');
        
        // Add welcome message
        addWelcomeMessage();
        
        // Enhance form inputs
        enhanceForms();
        
        // Add smooth transitions
        addTransitions();
        
        // Initialize tooltips
        initializeTooltips();
    }

    function addWelcomeMessage() {
        const mainSection = document.querySelector('.pf-c-page__main-section');
        if (!mainSection) return;

        const userName = document.querySelector('.pf-c-page__header-tools-item button')?.textContent?.trim() || 'Utilisateur';
        
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <h2>Bienvenue sur votre espace E-Learning, ${userName} !</h2>
            <p>Gérez votre profil, vos cours et vos paramètres de sécurité.</p>
        `;
        
        mainSection.insertBefore(welcomeDiv, mainSection.firstChild);
    }

    function enhanceForms() {
        // Add animation to form groups
        const formGroups = document.querySelectorAll('.pf-c-form__group');
        formGroups.forEach((group, index) => {
            group.style.animationDelay = `${index * 0.05}s`;
            group.style.animation = 'fadeIn 0.3s ease-out forwards';
        });

        // Enhance form controls
        const formControls = document.querySelectorAll('.pf-c-form-control');
        formControls.forEach(control => {
            // Add focus animation
            control.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            control.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
    }

    function addTransitions() {
        // Add smooth scroll behavior
        document.documentElement.style.scrollBehavior = 'smooth';

        // Animate cards on scroll
        const cards = document.querySelectorAll('.pf-c-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            observer.observe(card);
        });
    }

    function initializeTooltips() {
        // Simple tooltip implementation
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', function() {
                const tooltip = document.createElement('div');
                tooltip.className = 'custom-tooltip';
                tooltip.textContent = this.getAttribute('data-tooltip');
                
                document.body.appendChild(tooltip);
                
                const rect = this.getBoundingClientRect();
                tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = rect.bottom + 8 + 'px';
                tooltip.style.opacity = '1';
            });
            
            element.addEventListener('mouseleave', function() {
                const tooltip = document.querySelector('.custom-tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }

    // Add custom CSS for tooltips
    const tooltipStyles = document.createElement('style');
    tooltipStyles.textContent = `
        .custom-tooltip {
            position: fixed;
            background: #1e293b;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.875rem;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.2s ease;
            pointer-events: none;
            white-space: nowrap;
        }
        
        .custom-tooltip::before {
            content: '';
            position: absolute;
            top: -4px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-bottom: 4px solid #1e293b;
        }
    `;
    document.head.appendChild(tooltipStyles);

})();
