import asyncio
from playwright import async_api

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:8080", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # Fill in email and password and click login button.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('odair_orso@hotmail.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div/div[2]/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Turce.334180')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Serviços' button to navigate to service management page.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/div/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click on 'Novo Serviço' button to open the new service creation form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div/h3/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill the form fields: select a client, enter vehicle, plate, service value, commission percentage, and observations.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[2]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Click vehicle input field to open dropdown or autocomplete options and select a vehicle.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div/div[2]/div/div[3]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Select a vehicle from the dropdown or autocomplete options.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/main/div/div[2]/div[2]/div/div[7]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Fill observations field and click 'Salvar Alterações' to submit the form.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div[7]/textarea').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test service creation with commission calculation')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div[4]/div[2]/div[8]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Assertion: Verify the service is created with correct commission calculation and displayed data.
        # Locate the service entry with the specific observation text to identify the created service.
        service_locator = frame.locator("xpath=//div[contains(text(), 'Test service creation with commission calculation')]/ancestor::div[contains(@class, 'service-entry')]" )
        assert await service_locator.count() == 1, 'Created service entry not found or multiple entries found.'
        # Extract displayed values for commission percent, commission value, and gross value.
        com_percent_text = await service_locator.locator("xpath=.//span[contains(@class, 'commission-percent')] ").inner_text()
        com_value_text = await service_locator.locator("xpath=.//span[contains(@class, 'commission-value')] ").inner_text()
        gross_value_text = await service_locator.locator("xpath=.//span[contains(@class, 'gross-value')] ").inner_text()
        # Convert texts to float for calculation (remove currency symbols and %).
        com_percent = float(com_percent_text.replace('%', '').strip())
        com_value = float(com_value_text.replace('R$', '').replace(',', '.').strip())
        gross_value = float(gross_value_text.replace('R$', '').replace(',', '.').strip())
        # Calculate expected commission value.
        expected_com_value = round(gross_value * com_percent / 100, 2)
        assert abs(com_value - expected_com_value) < 0.01, f'Commission value {com_value} does not match expected {expected_com_value}'
        # Additional assertions to verify client, vehicle, and observations are displayed correctly.
        client_text = await service_locator.locator("xpath=.//span[contains(@class, 'client-name')] ").inner_text()
        vehicle_text = await service_locator.locator("xpath=.//span[contains(@class, 'vehicle-name')] ").inner_text()
        observations_text = await service_locator.locator("xpath=.//span[contains(@class, 'observations')] ").inner_text()
        assert 'PDR TEAM' in client_text, 'Client name does not match expected.'
        assert vehicle_text != '', 'Vehicle name should not be empty.'
        assert 'Test service creation with commission calculation' in observations_text, 'Observations text does not match expected.'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    