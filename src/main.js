function testGmailAPI() {
  try {
    // Gmail API が有効かテスト
    const response = Gmail.Users.Labels.list('me');
    console.log('Gmail API is working!');
    console.log('Found ' + response.labels.length + ' labels');
    return 'Success: Gmail API is enabled';
  } catch (error) {
    console.error('Error:', error);
    return 'Error: ' + error.message;
  }
}