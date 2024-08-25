document.addEventListener('DOMContentLoaded', function () {
    const productNameInput = document.getElementById('product-name');
    const suggestionsDiv = document.getElementById('suggestions');
    const searchForm = document.getElementById('search-form');
    const resultsDiv = document.getElementById('results');

    let debounceTimer;

    // Url API
    var urlAPI = 'https://search.quanhd.net';
    //var urlAPI = 'http://localhost:5000';

    // Hàm hiển thị các sản phẩm rẻ nhất mặc định
    function displayDefaultProducts(products) {
        const defaultProductsDiv = document.createElement("div");
        defaultProductsDiv.id = "default-products";
        defaultProductsDiv.className = "container mx-auto px-4 py-8";

        defaultProductsDiv.innerHTML = `
            <h2 class="mb-8 text-2xl font-bold text-center text-gray-800 dark:text-white">
                Sản phẩm được tìm kiếm nhiều nhất
            </h2>
        `;

        const productsGrid = document.createElement("div");
        productsGrid.className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6";

        products.forEach((product) => {
            const productCard = `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                    <img src="${product.cheapest_product.img_url}" alt="${product.cheapest_product.name}" class="w-full h-48 object-cover transition-transform duration-300 transform hover:scale-110">
                    <div class="p-4 flex-grow">
                        <h5 class="text-lg font-medium mb-1 text-gray-900 dark:text-white line-clamp-2" title="${product.cheapest_product.name}">${product.cheapest_product.name}</h5>
                        <p class="text-red-600 text-xl font-semibold mb-1 transition-transform duration-300 transform hover:scale-105">${product.cheapest_product.price.toLocaleString()} đ</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Nguồn: ${product.cheapest_product.source}</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Đánh giá: ${product.cheapest_product.rating}</p>
                        <p class="text-gray-600 dark:text-gray-400 text-sm mb-1">Lượt xem: ${product.search_count}</p>
                    </div>
                    <div class="p-4">
                        <a href="${product.cheapest_product.product_link}" target="_blank" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm w-full block text-center">Xem sản phẩm</a>
                    </div>
                </div>
            `;
            productsGrid.innerHTML += productCard;
        });

        defaultProductsDiv.appendChild(productsGrid);
        resultsDiv.appendChild(defaultProductsDiv);
    }

    // Hàm để lấy từ khóa thường tìm nhất
    function getTopKeywords() {
        fetch(`${urlAPI}/get_log?sort_by=search_count&order=desc&limit=12`)
            .then(response => response.json())
            .then(data => {
                displayTopKeywords(data);
                displayDefaultProducts(data);
            })
            .catch(error => console.error('Error:', error));
    }

    // Hàm hiển thị từ khóa thường tìm nhất
    function displayTopKeywords(keywords) {
        const topKeywordsDiv = document.createElement('div');
        topKeywordsDiv.className = 'top-keywords mt-3 flex flex-wrap';
        topKeywordsDiv.innerHTML = '<h6 class="text-gray-600 dark:text-gray-400 mr-2">Từ khóa thường tìm:</h6>';

        keywords.forEach(keyword => {
            const keywordSpan = document.createElement('span');
            keywordSpan.className = 'inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2 cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200';
            keywordSpan.textContent = keyword.keyword;
            keywordSpan.addEventListener('click', () => showKeywordPopup(keyword));
            topKeywordsDiv.appendChild(keywordSpan);
        });
        searchForm.appendChild(topKeywordsDiv);
    }

    // Hàm hiển thị popup cho từ khóa
    function showKeywordPopup(keyword) {
        const popupDiv = document.createElement('div');
        popupDiv.className = 'fixed inset-0 z-50 overflow-y-auto';
        popupDiv.setAttribute('aria-labelledby', 'modal-title');
        popupDiv.setAttribute('role', 'dialog');
        popupDiv.setAttribute('aria-modal', 'true');

        const cheapestProduct = keyword.cheapest_product;

        popupDiv.innerHTML = `
        <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" aria-hidden="true"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">​</span>
                <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                    <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="flex flex-col sm:flex-row sm:items-start">
                            <div class="mt-3 text-center sm:mt-0 sm:text-left sm:w-full">
                                <h2 class="text-2xl leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                    Sản phẩm rẻ nhất của: ${keyword.keyword}
                                </h2>
                                <hr class="my-4 border-gray-200 dark:border-gray-700">
                                <div class="mt-2 flex flex-col md:flex-row">
                                    <div class="transition-transform duration-300 transform hover:scale-105 mb-4 md:mb-0 md:mr-6 order-1 md:order-1">
                                        <img src="${cheapestProduct.img_url}" alt="${cheapestProduct.name}" class="w-full h-auto object-cover rounded-lg shadow-md">
                                    </div>
                                    <div class="order-1 md:order-2">
                                        <h5 class="text-lg font-medium mb-2 text-gray-900 dark:text-white">${cheapestProduct.name}</h5>
                                        <p class="text-2xl text-red-600 font-bold mb-2">${cheapestProduct.price.toLocaleString()} đ</p>
                                        <p class="text-gray-600 dark:text-gray-400 mb-2"><strong class="font-medium">Nguồn:</strong> ${cheapestProduct.source}</p>
                                        <p class="text-gray-600 dark:text-gray-400 mb-2"><strong class="font-medium">Đánh giá:</strong> ${cheapestProduct.rating}</p>
                                        <p class="text-gray-600 dark:text-gray-400 mb-2"><strong class="font-medium">Số lần tìm kiếm:</strong> ${keyword.search_count}</p>
                                        <p class="text-gray-600 dark:text-gray-400 mb-2"><strong class="font-medium">Tổng kết quả:</strong> ${keyword.total_results}</p>
                                        <p class="text-gray-600 dark:text-gray-400 mb-4"><strong class="font-medium">Tìm kiếm lần cuối lúc:</strong> ${new Date(keyword.first_search).toLocaleString()}</p>
                                        <a href="${cheapestProduct.product_link}" target="_blank" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-3 inline-block transition-transform duration-300 transform hover:scale-105">Xem sản phẩm</a>
                                    </div>
                                </div>
                                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mt-4 rounded-md">
                                    <i class="fas fa-exclamation-triangle mr-2"></i> Lưu ý: Dữ liệu có thể không chính xác do lỗi từ nguồn dữ liệu, bạn nên kiểm tra kỹ trước khi quyết định mua hàng.
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row justify-between">
                        <button type="button" class="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm transition-transform duration-300 transform hover:scale-105 mt-3 sm:mt-0" onclick="this.parentElement.parentElement.parentElement.remove()">Đóng</button>
                        <button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-transform duration-300 transform hover:scale-105" id="search-again">Tìm kiếm lại</button>
                    </div>
                </div>
            </div>
        </div>
    `;

        // Thêm popup vào trang web
        document.body.appendChild(popupDiv);

        // Thêm sự kiện click cho nút "Tìm kiếm lại"
        document.getElementById('search-again').addEventListener('click', () => {
            productNameInput.value = keyword.keyword;
            popupDiv.remove();
            searchForm.dispatchEvent(new Event('submit'));
        });

        // Thêm sự kiện click cho nút "Đóng"
        const closeButton = popupDiv.querySelector('button[onclick]');
        closeButton.addEventListener('click', () => {
            popupDiv.remove();
        });
    }

    // Sự kiện khi người dùng nhập vào ô tìm kiếm
    productNameInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const term = this.value;
            if (term.length >= 2) {
                fetch(`${urlAPI}/suggest?term=${encodeURIComponent(term)}`)
                    .then((response) => response.json())
                    .then((data) => {
                        displaySuggestions(data);
                    });
            } else {
                suggestionsDiv.innerHTML = '';
            }
        }, 300);
    });

    // Hàm hiển thị gợi ý tìm kiếm
    function displaySuggestions(suggestions) {
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
                suggestionsDiv.innerHTML = ''; // Dọn dẹp gợi ý khi chọn
            });

            suggestionList.appendChild(suggestionItem);
        });

        suggestionsDiv.appendChild(suggestionList);
    }

    document.addEventListener('click', function (event) {
        if (!suggestionsDiv.contains(event.target) && event.target !== productNameInput) {
            suggestionsDiv.innerHTML = ''; // Dọn dẹp gợi ý khi click ra ngoài
        }
    });

    suggestionsDiv.addEventListener('click', function (event) {
        event.stopPropagation();
    });

    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const productName = productNameInput.value;
        const starfield = document.getElementById('star-filter').value;
        document.getElementById('search-btn').disabled = true;
        document.getElementById('search-btn').innerHTML = 'Đang tìm kiếm...';

        //xoá div id note
        const note = document.getElementById('note');
        if (note) {
            note.remove();
        }

        //xoá div id default-products
        const defaultProducts = document.getElementById('default-products');
        if (defaultProducts) {
            defaultProducts.remove();
        }

        //hiển thị loading
        displayLoading();

        // Gửi request đến API để tìm kiếm
        fetch(`${urlAPI}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `product_name=${encodeURIComponent(productName)}&star_filter=${starfield}`,
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    resultsDiv.innerHTML = `<p class="text-red-500">${data.message}</p>`; // Thay đổi class
                } else {
                    displayResults(data);
                }
                document.getElementById('search-btn').disabled = false;
                document.getElementById('search-btn').innerHTML = 'Tìm kiếm';
            })
            .catch(error => console.error('Error:', error));
    });

    // Hàm hiển thị loading
    function displayLoading() {
        resultsDiv.innerHTML = `
            <div class="flex flex-col items-center justify-center mt-5 h-96">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div> 
                <p class="mt-3 text-gray-600 dark:text-gray-400">Xin vui lòng chờ, dữ liệu đang được tải...</p>
                <p class="mt-3 text-gray-600 dark:text-gray-400"><i class="fas fa-lightbulb text-yellow-500"></i> <span class="text red-500 dark:text-red-500">Lời Khuyên:</span> ${displayRandomTip()}</p>
            </div>
        `;
    }

    // Hàm hiển thị lời khuyên ngẫu nhiên
    function displayRandomTip() {
        const tips = [
            'Để tìm kiếm chính xác hơn, hãy nhập tên sản phẩm cụ thể hơn.',
            'Hãy kiểm tra kỹ thông tin sản phẩm trước khi quyết định mua hàng.',
            'Dữ liệu có thể không chính xác do lỗi từ nguồn dữ liệu, bạn nên kiểm tra kỹ trước khi quyết định mua hàng.',
            'Các sản phẩm rẻ nhất có thể không phải là sản phẩm tốt nhất, hãy cân nhắc kỹ trước khi mua hàng.',
            'Nếu bạn gặp vấn đề khi sử dụng website, hãy liên hệ với chúng tôi để được hỗ trợ.',
            'Chúng tôi không chịu trách nhiệm về thông tin sản phẩm, bạn nên kiểm tra kỹ trước khi quyết định mua hàng.',
            'Các sản phẩm hiển thị sau khi tìm kiếm có thể không phù hợp với từ khóa tìm kiếm của bạn, hãy nhập từ khóa cụ thể hơn.',
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        return randomTip;
    }

    // Hàm hiển thị kết quả tìm kiếm
    function displayResults(data) {
        const resultsDiv = document.getElementById("results");
        resultsDiv.innerHTML = "";

        // CSS cho tooltip (thêm vào file CSS của bạn)
        resultsDiv.innerHTML += `
          <style>
            .tooltip[data-popper-placement^="top"] > .tooltip-arrow {
              bottom: -4px;
            }
            .tooltip[data-popper-placement^="bottom"] > .tooltip-arrow {
              top: -4px;
            }
            .tooltip[data-popper-placement^="left"] > .tooltip-arrow {
              right: -4px;
            }
            .tooltip[data-popper-placement^="right"] > .tooltip-arrow {
              left: -4px;
            }
          </style>
        `;

        // Hiển thị bảng thống kê giá (không có collapse)
        resultsDiv.innerHTML += `
    <div class="price-stats mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h2 class="text-xl font-semibold dark:text-white mb-4">Thống kê giá cả</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 relative group">
                <p class="text-lg font-medium text-gray-900 dark:text-white">Giá trung bình</p>
                <p class="text-2xl font-bold text-blue-500 dark:text-blue-400">${Math.round(data.mean_price).toLocaleString()} đ</p>
                <span class="fas fa-question-circle absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer" data-tooltip-target="tooltip-mean" data-tooltip-placement="top"></span>
                <div id="tooltip-mean" role="tooltip" class="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                    Giá trung bình của tất cả các sản phẩm.
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 relative group">
                <p class="text-lg font-medium text-gray-900 dark:text-white">Độ lệch chuẩn</p>
                <p class="text-2xl font-bold text-green-500 dark:text-green-400">${Math.round(data.stdev_price).toLocaleString()} đ</p>
                <span class="fas fa-question-circle absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer" data-tooltip-target="tooltip-stdev" data-tooltip-placement="top"></span>
                <div id="tooltip-stdev" role="tooltip" class="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                    Độ lệch chuẩn của giá cả, thể hiện sự phân tán của giá.
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
            </div>
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 relative group">
                <p class="text-lg font-medium text-gray-900 dark:text-white">Tổng số sản phẩm</p>
                <p class="text-2xl font-bold text-purple-500 dark:text-purple-400">${data.filtered_products_count}</p>
                <span class="fas fa-question-circle absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer" data-tooltip-target="tooltip-total" data-tooltip-placement="top"></span>
                <div id="tooltip-total" role="tooltip" class="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700">
                    Tổng số sản phẩm được tìm thấy trong kết quả tìm kiếm.
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
            </div>
        </div>
    </div>
`;

        // Hiển thị sản phẩm rẻ nhất tổng quát
        resultsDiv.innerHTML += `
              <h2 class="mb-4 text-xl font-semibold dark:text-white">Sản phẩm rẻ nhất được tìm thấy</h2>
              ${createProductCard(data.cheapest_overall, true)}
          `;

        // Hiển thị sản phẩm rẻ nhất mỗi nguồn
        resultsDiv.innerHTML +=
            '<h2 class="mt-5 mb-4 text-xl font-semibold dark:text-white">Danh sách sản phẩm phù hợp với kết quả tìm kiếm</h2>';

        const cheapestProductsDiv = document.createElement("div");
        cheapestProductsDiv.classList.add("grid", "grid-cols-1", "sm:grid-cols-2", "md:grid-cols-3", "lg:grid-cols-4", "xl:grid-cols-6", "gap-4");

        data.cheapest_products.forEach((product) => {
            const productDiv = document.createElement("div");
            productDiv.classList.add("transition-transform", "duration-300", "transform", "hover:scale-105");
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

    // Hàm tạo card sản phẩm
    function createProductCard(product, isOverall = false, isCompact = false) {
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
    getTopKeywords();
});