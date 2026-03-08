from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # Collect console messages
    console_errors = []
    page.on(
        "console",
        lambda msg: console_errors.append(msg.text) if msg.type == "error" else None,
    )
    page.on("pageerror", lambda err: console_errors.append(str(err)))

    try:
        page.goto("http://localhost:5174", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=30000)

        print("Page loaded successfully!")

        # Check for errors
        if console_errors:
            print("\nConsole errors found:")
            for err in console_errors:
                print(f"  - {err}")
        else:
            print("No console errors!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
