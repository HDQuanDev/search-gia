        // Web Component for product search app
        class ProductSearchApp extends HTMLElement {
            constructor() {
                super();
                this.apiUrl = 'https://search.quanhd.net';
                this.attachShadow({
                    mode: 'open'
                });

                // Add external styles
                const styleSheet = document.createElement('style');
                styleSheet.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
            /* Tailwind CSS CDN */
            @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        `;
                this.shadowRoot.appendChild(styleSheet);

                // Add your component's HTML
                this.shadowRoot.innerHTML += `
            <div class="container mx-auto px-4 py-8">
                <h1 class="text-3xl font-bold text-center text-gray-900">Plugin tìm kiếm giá sản phẩm</h1>
                <p class="text-center text-gray-600 dark:text-gray-400 mb-4 text-xl">
                   Powered by <a href="https://www.facebook.com/quancp72h" class="text-blue-500 hover:underline" target="_blank">QuanHD</a>
                </p>
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                    <form id="search-form">
                        <div class="flex flex-col md:flex-row md:items-center md:space-x-4">
                            <div class="relative rounded-md shadow-sm mb-2 md:mb-0">
                                <select class="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-200" id="star-filter">
                                    <option value="0">Tất cả đánh giá</option>
                                    <option value="500">5 sao</option>
                                    <option value="400">4 sao trở lên</option>
                                    <option value="300">3 sao trở lên</option>
                                    <option value="200">2 sao trở lên</option>
                                    <option value="100">1 sao trở lên</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <input type="text" id="product-name" class="flex-grow px-4 py-2 rounded-md shadow-sm border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200
                            focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 md:mb-0" placeholder="Nhập tên sản phẩm cần tìm kiếm" required autocomplete="off">
                            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit" id="search-btn">
                                Tìm kiếm
                            </button>
                        </div>
                        <div id="suggestions" class="suggestions mt-2"></div>
                    </form>
                </div>
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4 rounded-md mb-8" id="note">
                    <strong class="font-bold">Lưu ý:</strong> Công cụ này chỉ giúp bạn tìm kiếm giá sản phẩm từ các trang web
                    khác nhau và lấy ra sản phẩm rẻ nhất. Các sản phẩm được lấy từ các trang web khác nhau nên có thể không
                    chính xác 100%. Bạn nên kiểm tra kỹ trước khi mua hàng. <strong>Chúng tôi không chịu trách nhiệm về bất kỳ
                        vấn đề nào xảy ra khi bạn mua hàng.</strong>
                </div>
                <div id="results"></div>
            </div>
        `;

                // Initialize event listeners and other setup
                this.initEventListeners();
                this.getTopKeywords();
            }
            initEventListeners() {
                const productNameInput = this.shadowRoot.getElementById('product-name');
                const suggestionsDiv = this.shadowRoot.getElementById('suggestions');
                const searchForm = this.shadowRoot.getElementById('search-form');
                const resultsDiv = this.shadowRoot.getElementById('results');
                let debounceTimer;

                productNameInput.addEventListener('input', () => {
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        const term = productNameInput.value;
                        if (term.length >= 2) {
                            fetch(`${this.apiUrl}/suggest?term=${encodeURIComponent(term)}`)
                                .then((response) => response.json())
                                .then((data) => {
                                    this.displaySuggestions(data, suggestionsDiv);
                                });
                        } else {
                            suggestionsDiv.innerHTML = '';
                        }
                    }, 300);
                });

                document.addEventListener('click', (event) => {
                    if (!suggestionsDiv.contains(event.target) && event.target !== productNameInput) {
                        suggestionsDiv.innerHTML = '';
                    }
                });

                suggestionsDiv.addEventListener('click', (event) => {
                    event.stopPropagation();
                });

                searchForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const productName = productNameInput.value;
                    const starfield = this.shadowRoot.getElementById('star-filter').value;
                    this.shadowRoot.getElementById('search-btn').disabled = true;
                    this.shadowRoot.getElementById('search-btn').innerHTML = 'Đang tìm kiếm...';
                    const note = this.shadowRoot.getElementById('note');
                    if (note) {
                        note.remove();
                    }
                    this.displayLoading(resultsDiv);
                    fetch(`${this.apiUrl}/search`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: `product_name=${encodeURIComponent(productName)}&star_filter=${starfield}`,
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.message) {
                                resultsDiv.innerHTML = `<p class="text-red-500">${data.message}</p>`;
                            } else {
                                this.displayResults(data, resultsDiv);
                            }
                            this.shadowRoot.getElementById('search-btn').disabled = false;
                            this.shadowRoot.getElementById('search-btn').innerHTML = 'Tìm kiếm';
                        })
                        .catch(error => console.error('Error:', error));
                });
            }


            displayLoading(resultsDiv) {
                resultsDiv.innerHTML = `
                    <div class="flex flex-col items-center justify-center mt-5 h-96">
                        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div> 
                        <p class="mt-3 text-gray-600 dark:text-gray-400">Xin vui lòng chờ, dữ liệu đang được tải...</p>
                    </div>
                `;
            }

            displaySuggestions(suggestions, suggestionsDiv) {
                suggestionsDiv.innerHTML = '';
                if (suggestions.length === 0) return;

                const suggestionList = document.createElement('ul');
                suggestionList.classList.add(
                    'absolute',
                    'z-10',
                    'bg-white',
                    'dark:bg-gray-800',
                    'rounded-md',
                    'shadow-lg',
                    'mt-2',
                    'py-1',
                    'text-base',
                    'ring-1',
                    'ring-black',
                    'ring-opacity-5',
                    'focus:outline-none',
                    'w-full',
                    'sm:text-sm'
                );

                suggestions.forEach((suggestion) => {
                    const suggestionItem = document.createElement('li');
                    suggestionItem.classList.add(
                        'px-4',
                        'py-2',
                        'cursor-pointer',
                        'hover:bg-gray-100',
                        'dark:hover:bg-gray-700',
                        'transition-colors',
                        'duration-200',
                        'text-gray-900',
                        'dark:text-gray-200'
                    );
                    suggestionItem.textContent = suggestion;

                    suggestionItem.addEventListener('click', function () {
                        productNameInput.value = suggestion;
                        suggestionsDiv.innerHTML = '';
                    });

                    suggestionList.appendChild(suggestionItem);
                });

                suggestionsDiv.appendChild(suggestionList);
            }

            displayResults(data, resultsDiv) {
                resultsDiv.innerHTML = "";

                // Hiển thị sản phẩm rẻ nhất tổng quát
                resultsDiv.innerHTML += `
                  <h2 class="mb-4 text-xl font-semibold dark:text-white">Sản phẩm rẻ nhất được tìm thấy</h2>
                  ${this.createProductCard(data.cheapest_overall, true)}
              `;

                // Hiển thị sản phẩm rẻ nhất mỗi nguồn
                resultsDiv.innerHTML +=
                    '<h2 class="mt-5 mb-4 text-xl font-semibold dark:text-white">Danh sách sản phẩm phù hợp với kết quả tìm kiếm</h2>';

                const cheapestProductsDiv = document.createElement("div");
                cheapestProductsDiv.classList.add("grid", "grid-cols-1", "sm:grid-cols-2", "md:grid-cols-3",
                    "lg:grid-cols-4", "xl:grid-cols-6", "gap-4");

                data.cheapest_products.forEach((product) => {
                    const productDiv = document.createElement("div");
                    productDiv.classList.add("transition-transform", "duration-300", "transform",
                        "hover:scale-105");
                    productDiv.innerHTML = `
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden h-full flex flex-col">
                        <img src="${product.img_url}" alt="${product.name}" class="w-full h-48 object-cover transition-transform duration-300 transform hover:scale-110">
                        <div class="p-4 flex-grow">
                            <h5 class="text-lg font-medium mb-1 text-gray-900 dark:text-white line-clamp-2" title="${product.name}">${product.name}</h5>
                            <p class="text-red-600 text-xl font-semibold mb-1 transition-transform duration-300 transform hover:scale-105">${product.price.toLocaleString()} đ</p>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Nguồn: ${product.source}</p>
                            <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Đánh giá: ${product.rating}</p>
                        </div>
                        <div class="p-4">
                            <a href="${product.product_link}" target="_blank" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm w-full block text-center">Xem sản phẩm</a>
                        </div>
                    </div>
                `;
                    cheapestProductsDiv.appendChild(productDiv);
                });

                resultsDiv.appendChild(cheapestProductsDiv);
            }

            createProductCard(product, isOverall = false, isCompact = false) {
                if (isOverall) {
                    return `
                    <div class="product-card overall bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:flex md:items-center">
                        <div class="md:w-1/3 mb-4 md:mb-0 md:mr-6 transition-transform duration-300 transform hover:scale-105">
                            <img src="${product.img_url}" alt="${product.name}" class="w-full h-auto object-cover rounded-lg shadow-md">
                        </div>
                        <div class="md:w-2/3">
                            <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">${product.name}</h3>
                            <p class="text-2xl text-red-600 font-bold mb-2">${product.price.toLocaleString()} đ</p>
                            <p class="text-gray-600 dark:text-gray-400 mb-2"><strong class="font-medium">Nguồn:</strong> ${product.source}</p>
                            <p class="text-gray-600 dark:text-gray-400 mb-2"><strong class="font-medium">Đánh giá:</strong> ${product.rating}</p>
                            <a href="${product.product_link}" target="_blank" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block transition-transform duration-300 transform hover:scale-105">Xem sản phẩm</a>
                        </div>
                    </div>
                `;
                } else {
                    return `
                    <div class="product-card compact bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-transform duration-300 transform hover:scale-105">
                        <img src="${product.img_url}" alt="${product.name}" class="w-full h-48 object-cover mb-3 rounded-lg shadow-md">
                        <h5 class="text-lg font-medium text-gray-900 dark:text-white mb-1 line-clamp-2" title="${product.name}">${product.name}</h5>
                        <p class="text-red-600 text-xl font-semibold mb-1 transition-transform duration-300 transform hover:scale-105">${product.price.toLocaleString()} đ</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Nguồn: ${product.source}</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Đánh giá: ${product.rating}</p>
                        <a href="${product.product_link}" target="_blank" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm w-full block text-center">Xem sản phẩm</a>
                    </div>
                `;
                }
            }


            // Hàm để lấy 8 từ khóa thường tìm nhất
            getTopKeywords() {
                fetch(`${this.apiUrl}/get_log?sort_by=search_count&order=desc&limit=12`)
                    .then(response => response.json())
                    .then(data => {
                        this.displayTopKeywords(data, this.shadowRoot.getElementById('search-form'));
                    })
                    .catch(error => console.error('Error:', error));
            }

            // Hàm hiển thị 8 từ khóa thường tìm nhất
            displayTopKeywords(keywords, searchForm) {
                const topKeywordsDiv = document.createElement('div');
                topKeywordsDiv.className = 'top-keywords mt-3 flex flex-wrap';
                topKeywordsDiv.innerHTML =
                    '<h6 class="text-gray-600 dark:text-gray-400 mr-2">Từ khóa thường tìm:</h6>';

                keywords.forEach(keyword => {
                    const keywordSpan = document.createElement('span');
                    keywordSpan.className =
                        'inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200';
                    keywordSpan.textContent = keyword.keyword;
                    keywordSpan.addEventListener('click', () => this.shadowRoot.getElementById('product-name').value = keyword.keyword);
                    topKeywordsDiv.appendChild(keywordSpan);
                });
                searchForm.appendChild(topKeywordsDiv);
            }
        }

        // Define the custom element
        customElements.define('product-search-app', ProductSearchApp);