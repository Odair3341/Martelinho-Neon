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
        # Input email and password, then click login button to access dashboard.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div/div[2]/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('odair_orso@hotmail.com')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div/div[2]/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Turce.334180')
        

        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Check if there are any tabs or buttons to navigate to graphs or charts related to commissions, services, or financial data to verify their responsiveness and label clarity.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/div/button[5]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Scroll down the commission details page to check for any embedded graphs or charts related to commissions or financial metrics.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Click on the 'Relatórios' tab to check for graphical representations of financial data and verify their responsiveness and label clarity.
        frame = context.pages[-1]
        elem = frame.locator('xpath=html/body/div/div[2]/nav/div/div/button[6]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # Scroll down the 'Relatórios' tab page to check for any graphs or charts related to financial data and verify their responsiveness and label clarity.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Scroll down further or explore other tabs or sections to find any graphs or charts related to financial data, commissions, or services to verify their responsiveness and label clarity.
        await page.mouse.wheel(0, window.innerHeight)
        

        # Assert dashboard financial summary metrics are displayed correctly
        financial_summary = await frame.locator('xpath=//div[contains(@class, "financial-summary")]').inner_text()
        assert 'R$ 59.111,42' in financial_summary, 'Total commissions value mismatch'
        assert '88' in financial_summary, 'Total services count mismatch'
        assert '1' in financial_summary, 'Total clients count mismatch'
        assert 'R$ 2.067,52' in financial_summary, 'Average ticket value mismatch'
          
        # Assert commission received and pending amounts and percentages are displayed correctly
        comissoes_recebidas_text = await frame.locator('xpath=//div[contains(text(), "comissões recebidas") or contains(text(), "comissoes recebidas")]').inner_text()
        assert 'R$ 42.571,89' in comissoes_recebidas_text, 'Received commissions amount mismatch'
        assert '72%' in comissoes_recebidas_text, 'Received commissions percentage mismatch'
          
        comissoes_pendentes_text = await frame.locator('xpath=//div[contains(text(), "comissões pendentes") or contains(text(), "comissoes pendentes")]').inner_text()
        assert 'R$ 16.539,53' in comissoes_pendentes_text, 'Pending commissions amount mismatch'
        assert '28%' in comissoes_pendentes_text, 'Pending commissions percentage mismatch'
          
        # Assert expenses paid amount and count are displayed correctly
        despesas_pagas_text = await frame.locator('xpath=//div[contains(text(), "despesas pagas") or contains(text(), "despesas pagas")]').inner_text()
        assert 'R$ 1.383,25' in despesas_pagas_text, 'Paid expenses amount mismatch'
        assert '2' in despesas_pagas_text, 'Paid expenses count mismatch'
          
        # Assert performance rate is displayed correctly
        performance_text = await frame.locator('xpath=//div[contains(text(), "Taxa de recebimento") or contains(text(), "performance")]').inner_text()
        assert '72%' in performance_text, 'Performance rate mismatch'
          
        # Assert graphs and charts are visible and have labels
        graphs = await frame.locator('xpath=//canvas | //svg').all()
        assert len(graphs) > 0, 'No graphs or charts found on dashboard'
        for graph in graphs:
            labels = await graph.locator('xpath=.//text() | .//label').all_text_contents()
            assert any(labels), 'Graph labels missing or not clear'
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    