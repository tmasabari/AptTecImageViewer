export class PageNavigationToolbar {
    constructor(numPages, toolbarSelector, gotoCallback) {
        this.numPages = numPages;
        this.currentPage = 1;
        this.toolbarSelector = toolbarSelector;
        this.gotoCallback = gotoCallback;
        this.toolbar = this.createToolbar();
    }

    createToolbar() {
        const toolbar = document.querySelector(this.toolbarSelector);
        if (this.numPages && this.numPages < 2) {
            toolbar.innerText = ' Page 1/1';
            return;
        } 
        toolbar.innerText = ''; //clear existing items fa-1 end => fa-dice-one
        this.firstButton = this.createButton('btn-secondary', 'fa-solid fa-backward-step', '', this.goToPage.bind(this, 1));
        this.prevButton = this.createButton('btn-secondary', 'fa-solid fa-left-long', '', this.goToPreviousPage.bind(this));
        this.nextButton = this.createButton('btn-secondary', 'fa-solid fa-right-long', '', this.goToNextPage.bind(this));
        this.lastButton = this.createButton('btn-secondary', 'fa-solid fa-forward-step', '', this.goToPage.bind(this, this.numPages));

        const pageNumberInput = document.createElement('input');
        pageNumberInput.classList.add('pageNumber');
        pageNumberInput.type = 'number';
        pageNumberInput.min = 1;
        pageNumberInput.max = this.numPages;
        pageNumberInput.value = 1; 
        //extra characters for up down controls
        pageNumberInput.style.width = (this.numPages.toString().length + 3) + 'ch';
        pageNumberInput.style.textAlign = 'right';
        pageNumberInput.addEventListener('change', this.goToPage.bind(this,null));

        const pageCountSpan = document.createElement('span');
        pageCountSpan.classList.add('pageCount');
        pageCountSpan.innerHTML = ' / ' + this.numPages.toString();

        this.firstButton.disabled = true;
        toolbar.appendChild(this.firstButton);
        this.prevButton.disabled = true;
        toolbar.appendChild(this.prevButton);
        toolbar.appendChild(pageNumberInput);
        toolbar.appendChild(pageCountSpan);
        toolbar.appendChild(this.nextButton);
        toolbar.appendChild(this.lastButton);
        return toolbar;
    }

    createButton(buttonClass, iconClass, label, onClick) {
        const button = document.createElement('button');
        if (buttonClass) {
            const classArray = buttonClass.split(' ');
            classArray.forEach(cssClass => {
                button.classList.add(cssClass);
            });
        }
        button.classList.add('btn', 'navigation-button');
        button.innerHTML = `<i class="fas ${iconClass}"></i> ${label}`;
        button.addEventListener('click', onClick);
        return button;
    }

    goToPage(pageNumber) {
        const pageNumberInput = document.querySelector(this.toolbarSelector + ' .pageNumber');
        if (pageNumber) {
            this.currentPage = parseInt(pageNumber);
            pageNumberInput.value = this.currentPage;
        }
        else {
            this.currentPage = parseInt(pageNumberInput.value);
        }
        this.firstButton.disabled = false;
        this.prevButton.disabled = false;
        this.nextButton.disabled = false;
        this.lastButton.disabled = false;
        if(this.currentPage ==1) {
            this.firstButton.disabled = true;
            this.prevButton.disabled = true;
        }
        else if(this.currentPage == this.numPages) {
            this.nextButton.disabled = true;
            this.lastButton.disabled = true;
        }
        console.log(`Navigating to page ${this.currentPage}`);
        this.gotoCallback();
    }

    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    goToNextPage() {
        if (this.currentPage < this.numPages) {
            this.goToPage(this.currentPage + 1);
        }
    }
}