import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            # Navigate to the frontend application
            await page.goto("http://localhost:5173", timeout=60000)

            # Wait for the main dashboard heading to be visible
            heading = page.get_by_role("heading", name="UNEP Air Quality Platform")
            await expect(heading).to_be_visible(timeout=30000)

            # Wait for the map to be loaded (ArcGIS maps often use this class)
            map_element = page.locator("div.esri-view")
            await expect(map_element).to_be_visible(timeout=30000)

            # Wait for the policy recommendations table to be visible
            policy_table_heading = page.get_by_role("heading", name="Policy Recommendations")
            await expect(policy_table_heading).to_be_visible(timeout=30000)

            # Give the page a little extra time for all components to render
            await page.wait_for_timeout(5000)

            # Take a screenshot
            await page.screenshot(path="jules-scratch/verification/dashboard.png")
            print("Screenshot taken successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
