#!/usr/bin/env python3
"""
8WEEKS FUJIMI サイトのPDF生成スクリプト
Playwright使用でヘッドレスブラウザからPDF生成
"""

import asyncio
from playwright.async_api import async_playwright
import os

async def create_pdf():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        
        # ローカルサーバーのHTMLを読み込み
        await page.goto('http://localhost:8080')
        
        # デスクトップ版PDF
        await page.pdf(
            path='8weeks-fujimi-desktop.pdf',
            format='A4',
            print_background=True,
            margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
        )
        
        # モバイル版PDF
        await page.set_viewport_size({'width': 375, 'height': 812})  # iPhone 12 Pro
        await page.pdf(
            path='8weeks-fujimi-mobile.pdf', 
            format='A4',
            print_background=True,
            margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
        )
        
        await browser.close()
        print("✅ PDF作成完了:")
        print("  - 8weeks-fujimi-desktop.pdf")
        print("  - 8weeks-fujimi-mobile.pdf")

if __name__ == "__main__":
    print("Playwright PDF生成を実行中...")
    print("pip install playwright が必要です")
    # asyncio.run(create_pdf())