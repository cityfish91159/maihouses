const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'TrustRoom', 'DataCollectionModal.test.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find and replace Test 1 (lines 283-319)
let inTest1 = false;
let test1LineStart = -1;
let test1LineEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('it("應該支援 Tab 鍵循環聚焦 Modal 內元素（Forward）"')) {
    test1LineStart = i;
    inTest1 = true;
  }
  if (inTest1 && lines[i] === '  });') {
    test1LineEnd = i;
    break;
  }
}

const test1New = [
  '  it("應該支援 Tab 鍵循環聚焦 Modal 內元素（Forward）", async () => {',
  '    const user = userEvent.setup();',
  '',
  '    render(',
  '      <DataCollectionModal',
  '        isOpen={true}',
  '        onSubmit={mockOnSubmit}',
  '        onSkip={mockOnSkip}',
  '      />,',
  '    );',
  '',
  '    // 填寫必填欄位以啟用送出按鈕',
  '    const nameInput = screen.getByPlaceholderText("請輸入您的姓名");',
  '    const phoneInput = screen.getByPlaceholderText("0912-345-678");',
  '    await user.type(nameInput, "測試用戶");',
  '    await user.type(phoneInput, "0912345678");',
  '',
  '    // 等待送出按鈕變成 enabled',
  '    await waitFor(() => {',
  '      const submitButton = screen.getByText("送出");',
  '      expect(submitButton).not.toBeDisabled();',
  '    });',
  '',
  '    // 重新聚焦到姓名輸入框開始測試 Tab 循環',
  '    nameInput.focus();',
  '    expect(nameInput).toHaveFocus();',
  '',
  '    // Tab 到下一個元素（電話輸入框）',
  '    await user.keyboard("{Tab}");',
  '    expect(phoneInput).toHaveFocus();',
  '',
  '    // Tab 到下一個元素（Email 輸入框）',
  '    await user.keyboard("{Tab}");',
  '    const emailInput = screen.getByPlaceholderText("example@email.com (選填)");',
  '    expect(emailInput).toHaveFocus();',
  '',
  '    // Tab 到下一個元素（稍後再說按鈕）',
  '    await user.keyboard("{Tab}");',
  '    const skipButton = screen.getByText("稍後再說");',
  '    expect(skipButton).toHaveFocus();',
  '',
  '    // Tab 到下一個元素（送出按鈕） - 現在應該是啟用狀態',
  '    await user.keyboard("{Tab}");',
  '    const submitButton = screen.getByText("送出");',
  '    expect(submitButton).toHaveFocus();',
  '  });'
];

if (test1LineStart !== -1 && test1LineEnd !== -1) {
  lines.splice(test1LineStart, test1LineEnd - test1LineStart + 1, ...test1New);
  console.log(`✅ 修復 Test 1 (行 ${test1LineStart}-${test1LineEnd})`);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('✅ 完成');
