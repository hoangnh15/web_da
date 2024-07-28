document.addEventListener("DOMContentLoaded", function() {
    const submitButton = document.querySelector(".submit");
    const walletKeyInput = document.getElementById("wallet_key");
    const passwordInput = document.getElementById("pass_key");

    submitButton.addEventListener("click", function() {
        const secretkey = walletKeyInput.value.trim();
        const password = passwordInput.value.trim();

        // Kiểm tra nếu các trường đều đã được điền
        if (!secretkey || !password) {
            alert("Vui lòng nhập đầy đủ mật khẩu và secret key.");
            return;
        }

        // Gửi yêu cầu POST tới server
        fetch('/api/change_secretkey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ secretkey, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.code === '200') {
                alert(`${data.message}`);
                
            } else {
                alert(`Lỗi: ${data.message}`);
                
            }
        })
        .catch(error => {
            console.error('Lỗi khi gửi yêu cầu:', error);
            alert('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        });
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // Gọi API để lấy thông tin số dư
    fetch('/api/getbalance', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(result => {
        if (result.error) {
            console.error('Error:', result.error);
            alert('Đã xảy ra lỗi khi lấy số dư.');
        } else {
            var b = result.balance;
            console.log(result.balance);
            document.getElementById('balance').innerText = `Balance: ${b} coin`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Đã xảy ra lỗi khi gửi dữ liệu.');
    });
});