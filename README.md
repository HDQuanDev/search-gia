# Thông Tin

Đây là một project nhỏ của mình, trong quá trình học tập và thực hành về môn học **Chuyển đổi số**. \
\
**Lưu ý**: Project này dùng để học tập và tham khảo, không sử dụng cho mục đích thương mại.


# Công Nghệ Sử Dụng

- Ngôn ngữ lập trình: [Python](https://www.python.org/).
- Framework Web: [Flask](https://flask.palletsprojects.com/).
- Framework CSS: [Tailwind CSS](https://tailwindcss.com/).
- Thư viện Web Scraping: [Playwright](https://playwright.dev/).
- Thư viện xử lý dữ liệu: [BeautifulSoup4](https://www.crummy.com/software/BeautifulSoup/bs4/doc/).
- Thư viện gửi request: [Requests](https://docs.python-requests.org/en/master/).
- Thư viện xử lý chuỗi: [Unidecode](https://pypi.org/project/Unidecode/).
- Thư viện hỗ trợ CORS: [Flask-Cors](https://flask-cors.readthedocs.io/en/latest/).
- Front End: [HTML](https://developer.mozilla.org/en-US/docs/Web/HTML), [CSS](https://developer.mozilla.org/en-US/docs/Web/CSS), [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript).

# Danh Sách File

- `templates`: Thư mục chứa các file html của giao diện web.
- `static`: Thư mục chứa các file css, js, ảnh của giao diện web.
- `app.py`: File chính của project, chứa các Roter, API và các hàm xử lý dữ liệu.
- `product_filter.py`: File chứa các hàm xử lý dữ liệu sản phẩm.

# Chức Năng & Tiện Ích

- Lấy dữ liệu sản phẩm từ trang web [https://www.google.com/](https://www.google.com/) bằng phương pháp Web Scraping.

- Phân tích dữ liệu và chuyển đổi sang dạng json.

- Phân tích để lấy các sản phẩm giá rẻ nhất theo từ khóa tìm kiếm.

- Tạo API để trả về dữ liệu đã phân tích.

- Tạo giao diện web để hiển thị dữ liệu đã phân tích.

# Hướng Dẫn Sử Dụng

1. Clone project về máy tính của bạn:
    ```bash
    git clone https://github.com/HDQuanDev/search-gia.git
    ```
2. Cài đặt các thư viện cần thiết:
    ```bash
    pip install -r requirements.txt
    ```
3. Chạy project:
    ```bash
    python app.py
    ```
4. Truy cập vào địa chỉ [http://localhost:5000/](http://localhost:5000/) để sử dụng.

# Liên Hệ

Nếu bạn có bất kỳ thắc mắc hoặc góp ý nào, hãy liên hệ với mình qua:
- Facebook: [Hứa Đức Quân](https://www.facebook.com/quancp72h)

