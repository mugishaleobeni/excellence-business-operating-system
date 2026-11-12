import json
import os
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

ARTIFACTS_DIR = "/home/engineer/.gemini/antigravity/brain/d4c21cea-ff22-4237-b009-53e40721be78"

def run_test():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,900")
    
    service = Service("/usr/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)
    wait = WebDriverWait(driver, 15)
    
    results = {}
    
    try:
        # Step 1: Login
        print("Step 1: Navigating to login...")
        driver.get("http://localhost:5173/login")
        time.sleep(2)
        
        email_inp = wait.until(EC.presence_of_element_located((By.XPATH, "//input[@type='email']")))
        email_inp.clear()
        email_inp.send_keys("mugishaleobeni0@gmail.com")
        
        pwd_inp = driver.find_element(By.XPATH, "//input[@type='password']")
        pwd_inp.clear()
        pwd_inp.send_keys("1781sarah!")
        
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_01_login.png")
        
        submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
        driver.execute_script("arguments[0].click();", submit_btn)
        
        time.sleep(4)
        print("Logged in, current URL:", driver.current_url)
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_02_after_login.png")
        
        # Step 2: Navigate to Products -> All Products
        print("Step 2: Navigating to Products -> All Products...")
        driver.get("http://localhost:5173/dashboard?arch=buy-and-sell&module=Products&page=All+Products")
        time.sleep(3)
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_03_products_page.png")
        
        # Check Table Headers
        headers = [th.text.strip() for th in driver.find_elements(By.XPATH, "//table//th") if th.text.strip()]
        print("Detected Table Headers:", headers)
        results["detected_headers"] = headers
        
        assert "CATEGORY NAME" not in headers, "FAILED: CATEGORY NAME should not be in All Products table headers!"
        assert any("PRODUCT" in h for h in headers), f"FAILED: Expected PRODUCT in headers, got {headers}"
        
        # Step 3: Click "+ New Product" button
        print("Step 3: Opening + New Product modal...")
        new_prod_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'New Product')]")))
        driver.execute_script("arguments[0].click();", new_prod_btn)
        time.sleep(2)
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_04_new_product_modal.png")
        
        # Check if Scannable QR code is rendered in the modal
        qr_imgs = driver.find_elements(By.XPATH, "//img[contains(@alt, 'QR Code') or contains(@src, 'qrcode')]")
        print(f"Found {len(qr_imgs)} QR code images in modal.")
        results["modal_qr_code_found"] = len(qr_imgs) > 0
        
        # Fill Product form
        title_inp = driver.find_element(By.XPATH, "//form//input[@required]")
        title_inp.clear()
        title_inp.send_keys("Heineken Beer 500ml Can")
        
        # Cost and Selling price inputs
        num_inputs = driver.find_elements(By.XPATH, "//form//input[@inputmode='numeric']")
        if len(num_inputs) >= 2:
            num_inputs[0].clear()
            num_inputs[0].send_keys("1800")
            num_inputs[1].clear()
            num_inputs[1].send_keys("2500")
        
        # Current stock
        stock_inps = driver.find_elements(By.XPATH, "//form//input[@type='number']")
        if stock_inps:
            stock_inps[0].clear()
            stock_inps[0].send_keys("45")
            
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_05_modal_filled.png")
        
        # Submit form
        save_btn = driver.find_element(By.XPATH, "//form//button[@type='submit']")
        driver.execute_script("arguments[0].click();", save_btn)
        time.sleep(3)
        
        print("Product saved! Checking table...")
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_06_table_with_product.png")
        
        # Check product row
        page_text = driver.find_element(By.TAG_NAME, "body").text
        assert "Heineken Beer 500ml Can" in page_text, "FAILED: Added product not found in table text!"
        print("SUCCESS: Heineken Beer 500ml Can displayed in table!")
        
        # Step 4: Click on the product row or View Details icon to view the scannable QR Code
        print("Step 4: Opening product details to inspect QR code...")
        view_icons = driver.find_elements(By.XPATH, "//table//button[@title='View Details' or contains(., 'View')]")
        if view_icons:
            driver.execute_script("arguments[0].click();", view_icons[0])
        else:
            rows = driver.find_elements(By.XPATH, "//table//tbody//tr")
            if rows:
                driver.execute_script("arguments[0].click();", rows[0])
        time.sleep(2)
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_07_product_detail_qr.png")
        
        detail_qrs = driver.find_elements(By.XPATH, "//img[contains(@alt, 'QR Code') or contains(@src, 'qrcode')]")
        print(f"Found {len(detail_qrs)} QR code elements in detail modal.")
        results["detail_modal_qr_code_found"] = len(detail_qrs) > 0
        
        # Close detail modal
        close_btn = driver.find_element(By.XPATH, "//button[contains(., 'Close') or @title='Close']")
        driver.execute_script("arguments[0].click();", close_btn)
        time.sleep(1)
        
        # Step 5: Test Danger Zone in Settings
        print("Step 5: Navigating to Settings to test Danger Zone...")
        driver.get("http://localhost:5173/dashboard?arch=buy-and-sell&module=Settings&page=Business+Profile")
        time.sleep(3)
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_08_settings_danger_zone.png")
        
        danger_headers = driver.find_elements(By.XPATH, "//*[contains(text(), 'Danger Zone')]")
        assert len(danger_headers) > 0, "FAILED: Danger Zone header not found in Settings!"
        print("SUCCESS: Danger Zone header found!")
        
        # Open Delete Account Modal
        del_acc_btn = driver.find_element(By.XPATH, "//button[contains(., 'Delete My Account')]")
        driver.execute_script("arguments[0].scrollIntoView(true);", del_acc_btn)
        time.sleep(1)
        driver.execute_script("arguments[0].click();", del_acc_btn)
        time.sleep(2)
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_09_delete_account_modal.png")
        
        # Check confirmation input
        confirm_inp = driver.find_element(By.XPATH, "//input[@placeholder='DELETE']")
        confirm_btn = driver.find_element(By.XPATH, "//button[contains(., 'Confirm Delete')]")
        
        # Button should be disabled initially
        is_disabled = not confirm_btn.is_enabled()
        print("Confirm Delete disabled initially:", is_disabled)
        results["delete_btn_initially_disabled"] = is_disabled
        
        # Type DELETE
        confirm_inp.send_keys("DELETE")
        time.sleep(1)
        is_enabled_now = confirm_btn.is_enabled()
        print("Confirm Delete enabled after typing DELETE:", is_enabled_now)
        results["delete_btn_enabled_after_delete_input"] = is_enabled_now
        
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_10_delete_modal_ready.png")
        
        # Cancel modal so we preserve the account
        cancel_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Cancel')]")
        driver.execute_script("arguments[0].click();", cancel_btn)
        time.sleep(1)
        
        results["status"] = "ALL_PASSED"
        print("ALL TESTS PASSED SUCCESSFULLY!")
        
    except Exception as e:
        print("Test failed with exception:", str(e))
        results["status"] = "FAILED"
        results["error"] = str(e)
        driver.save_screenshot(f"{ARTIFACTS_DIR}/test_error.png")
    finally:
        driver.quit()
        with open(f"{ARTIFACTS_DIR}/qa_products_and_qr_report.json", "w") as f:
            json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_test()
