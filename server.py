import http.server
import socketserver

PORT = 8080

class ThreadingSimpleServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    pass

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

with ThreadingSimpleServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Serving at port {PORT} with threading and no-cache enabled...")
    httpd.serve_forever()
