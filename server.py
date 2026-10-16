
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, parse_qs, urlencode
import json


class SkyWatchHandler(SimpleHTTPRequestHandler):

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path != "/api/states/all":
            return super().do_GET()

        # Forward the requested region to OpenSky.
        params = parse_qs(parsed.query)
        query = urlencode(params, doseq=True)

        url = "https://opensky-network.org/api/states/all"
        if query:
            url += "?" + query

        request = Request(
            url,
            headers={"User-Agent": "SkyWatch-Student-Project/1.0"}
        )

        try:
            with urlopen(request, timeout=25) as response:
                body = response.read()
                status = response.status

        except HTTPError as error:
            body = json.dumps({
                "error": f"OpenSky returned HTTP {error.code}"
            }).encode()
            status = error.code

        except (URLError, TimeoutError) as error:
            body = json.dumps({
                "error": f"Could not reach OpenSky: {error}"
            }).encode()
            status = 502

        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)


server = ThreadingHTTPServer(("127.0.0.1", 8000), SkyWatchHandler)

print("SkyWatch server running at http://127.0.0.1:8000")
print("Keep this terminal open while using SkyWatch.")

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nSkyWatch server stopped.")
    server.server_close()
