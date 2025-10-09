import http.server
import socketserver

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith('.usdz'):
            self.send_header('Content-Type', 'model/vnd.usdz+zip')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

PORT = 8000
with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
    print(f"Serving at http://0.0.0.0:{PORT}")
    httpd.serve_forever()