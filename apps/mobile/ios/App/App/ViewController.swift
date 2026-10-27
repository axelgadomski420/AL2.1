import UIKit
import Capacitor

class ViewController: CAPBridgeViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        
        // Configure the web view
        configureWebView()
    }

    private func configureWebView() {
        // Enable dark mode for web content
        if #available(iOS 13.0, *) {
            overrideUserInterfaceStyle = .dark
        }
        
        // Configure web view settings
        if let webView = bridge?.webView {
            // Enable JavaScript
            webView.configuration.preferences.javaScriptEnabled = true
            
            // Enable DOM storage
            webView.configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
            
            // Set user agent
            let originalUserAgent = webView.configuration.applicationNameForUserAgent
            let customUserAgent = "AL/1.0.0 " + originalUserAgent
            webView.customUserAgent = customUserAgent
            
            // Set background color to match app theme
            webView.backgroundColor = UIColor(named: "Background") ?? .black
            webView.isOpaque = false
            
            // Disable bounce effect
            webView.scrollView.bounces = false
            webView.scrollView.alwaysBounceVertical = false
            webView.scrollView.alwaysBounceHorizontal = false
        }
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        
        // Hide navigation bar if needed
        navigationController?.setNavigationBarHidden(true, animated: animated)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
    }

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
    }

    // Handle safe area insets
    override func viewSafeAreaInsetsDidChange() {
        super.viewSafeAreaInsetsDidChange()
        
        // Pass safe area insets to web view
        if let webView = bridge?.webView {
            let insets = view.safeAreaInsets
            let js = """
                window.__capacitorSafeAreaInsets = {
                    top: $top,
                    right: $right,
                    bottom: $bottom,
                    left: $left
                };
                window.dispatchEvent(new CustomEvent('safeAreaInsetsChanged', {
                    detail: window.__capacitorSafeAreaInsets
                }));
            """
            let script = js
                .replacingOccurrences(of: "$top", with: "\\"\\" + String(format: "%.1f", insets.top) + "\\"")
                .replacingOccurrences(of: "$right", with: "\\"\\" + String(format: "%.1f", insets.right) + "\\"")
                .replacingOccurrences(of: "$bottom", with: "\\"\\" + String(format: "%.1f", insets.bottom) + "\\"")
                .replacingOccurrences(of: "$left", with: "\\"\\" + String(format: "%.1f", insets.left) + "\\"")
            webView.evaluateJavaScript(script)
        }
    }
}
