// 8WEEKS FUJIMI 予約システム
// Gmail・Googleカレンダー連携予約管理

class BookingSystem {
    constructor() {
        this.selectedProperty = null;
        this.selectedDates = {
            checkin: null,
            checkout: null
        };
        this.currentDate = new Date();
        this.bookedDates = {}; // 実際の予約データはGoogle Calendar APIから取得
        
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.renderCalendar();
        this.updateMinDates();
        this.loadGoogleAPIs();
    }

    initializeEventListeners() {
        // 物件選択
        document.querySelectorAll('input[name="property"]').forEach(radio => {
            radio.addEventListener('change', this.handlePropertySelection.bind(this));
        });

        // 日程選択
        document.getElementById('checkin').addEventListener('change', this.handleDateSelection.bind(this));
        document.getElementById('checkout').addEventListener('change', this.handleDateSelection.bind(this));

        // 人数選択
        document.getElementById('guests').addEventListener('change', this.validateGuestCount.bind(this));

        // カレンダー操作
        document.getElementById('prevMonth').addEventListener('click', this.previousMonth.bind(this));
        document.getElementById('nextMonth').addEventListener('click', this.nextMonth.bind(this));

        // フォーム送信
        document.getElementById('bookingForm').addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    loadGoogleAPIs() {
        // Google APIs初期化
        gapi.load('auth2:client', () => {
            this.initializeGoogleAuth();
        });
    }

    async initializeGoogleAuth() {
        try {
            await gapi.client.init({
                // Step 4で取得した値に置き換えてください
                apiKey: 'YOUR_API_KEY_FROM_STEP_4_3',
                clientId: '997036446203-au38c995ehbmtu9umphp3h4pb1d9424i.apps.googleusercontent.com',
                discoveryDocs: [
                    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest',
                    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
                ],
                scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar'
            });

            console.log('Google APIs initialized');
            this.loadBookedDates();
        } catch (error) {
            console.error('Google API initialization failed:', error);
            this.showMessage('Google API の初期化に失敗しました。管理者にお問い合わせください。', 'error');
        }
    }

    async loadBookedDates() {
        try {
            // Google Calendar APIから予約済み日程を取得
            // 実装例：各物件のカレンダーIDを使用して予約を取得
            const calendarIds = {
                'fujimi': 'YOUR_FUJIMI_CALENDAR_ID@group.calendar.google.com',    // Step 5.2で取得
                'quriu': 'YOUR_QURIU_CALENDAR_ID@group.calendar.google.com',      // Step 5.2で取得
                'studio': 'YOUR_STUDIO_CALENDAR_ID@group.calendar.google.com'     // Step 5.2で取得
            };

            for (const [property, calendarId] of Object.entries(calendarIds)) {
                const response = await gapi.client.calendar.events.list({
                    calendarId: calendarId,
                    timeMin: new Date().toISOString(),
                    timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime'
                });

                this.bookedDates[property] = response.result.items || [];
            }

            this.renderCalendar();
        } catch (error) {
            console.error('Failed to load booked dates:', error);
            // デモ用のサンプルデータ
            this.bookedDates = {
                'fujimi': [],
                'quriu': [],
                'studio': []
            };
        }
    }

    handlePropertySelection(event) {
        // 以前の選択をクリア
        document.querySelectorAll('.property-card').forEach(card => {
            card.classList.remove('selected');
        });

        // 新しい選択を設定
        event.target.closest('.property-card').classList.add('selected');
        this.selectedProperty = {
            id: event.target.value,
            maxGuests: parseInt(event.target.dataset.maxGuests),
            price: parseInt(event.target.dataset.price)
        };

        this.updateGuestOptions();
        this.validateForm();
        this.calculatePrice();
    }

    updateGuestOptions() {
        const guestsSelect = document.getElementById('guests');
        const maxGuests = this.selectedProperty ? this.selectedProperty.maxGuests : 8;

        // 選択可能な人数を制限
        Array.from(guestsSelect.options).forEach((option, index) => {
            if (index === 0) return; // "選択してください" はスキップ
            const guestCount = parseInt(option.value);
            option.disabled = guestCount > maxGuests;
            option.style.display = guestCount > maxGuests ? 'none' : 'block';
        });

        // 現在の選択が制限を超えている場合はクリア
        if (guestsSelect.value && parseInt(guestsSelect.value) > maxGuests) {
            guestsSelect.value = '';
        }
    }

    handleDateSelection() {
        const checkinInput = document.getElementById('checkin');
        const checkoutInput = document.getElementById('checkout');

        this.selectedDates.checkin = checkinInput.value ? new Date(checkinInput.value) : null;
        this.selectedDates.checkout = checkoutInput.value ? new Date(checkoutInput.value) : null;

        // チェックアウト日の最小値を設定
        if (this.selectedDates.checkin) {
            const minCheckout = new Date(this.selectedDates.checkin);
            minCheckout.setDate(minCheckout.getDate() + 1);
            checkoutInput.min = this.formatDate(minCheckout);

            // チェックアウト日がチェックイン日より前の場合はクリア
            if (this.selectedDates.checkout && this.selectedDates.checkout <= this.selectedDates.checkin) {
                checkoutInput.value = '';
                this.selectedDates.checkout = null;
            }
        }

        this.validateForm();
        this.calculatePrice();
        this.renderCalendar();
    }

    validateGuestCount() {
        this.validateForm();
    }

    validateForm() {
        const form = document.getElementById('bookingForm');
        const submitBtn = document.getElementById('submitBtn');
        
        const isValid = 
            this.selectedProperty &&
            this.selectedDates.checkin &&
            this.selectedDates.checkout &&
            document.getElementById('guests').value &&
            document.getElementById('firstName').value &&
            document.getElementById('lastName').value &&
            document.getElementById('email').value &&
            document.getElementById('phone').value;

        submitBtn.disabled = !isValid;
    }

    calculatePrice() {
        if (!this.selectedProperty || !this.selectedDates.checkin || !this.selectedDates.checkout) {
            document.getElementById('nights').textContent = '0';
            document.getElementById('basePrice').textContent = '¥0';
            document.getElementById('totalPrice').textContent = '¥0';
            return;
        }

        const nights = Math.ceil((this.selectedDates.checkout - this.selectedDates.checkin) / (1000 * 60 * 60 * 24));
        const basePrice = nights * this.selectedProperty.price;
        const cleaningFee = 3000;
        const totalPrice = basePrice + cleaningFee;

        document.getElementById('nights').textContent = nights.toString();
        document.getElementById('basePrice').textContent = `¥${basePrice.toLocaleString()}`;
        document.getElementById('totalPrice').textContent = `¥${totalPrice.toLocaleString()}`;
    }

    updateMinDates() {
        const today = new Date();
        const minDate = this.formatDate(today);
        document.getElementById('checkin').min = minDate;
        document.getElementById('checkout').min = minDate;
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // カレンダー表示
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const monthHeader = document.getElementById('currentMonth');
        
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        monthHeader.textContent = `${year}年${month + 1}月`;
        
        // カレンダーをクリア
        calendar.innerHTML = '';
        
        // 曜日ヘッダー
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        weekdays.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'calendar-cell header';
            cell.textContent = day;
            calendar.appendChild(cell);
        });
        
        // 月の最初の日と最後の日
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // カレンダーセルを生成
        for (let i = 0; i < 42; i++) {
            const cellDate = new Date(startDate);
            cellDate.setDate(startDate.getDate() + i);
            
            const cell = document.createElement('div');
            cell.className = 'calendar-cell date';
            cell.textContent = cellDate.getDate();
            
            // 現在の月以外は薄く表示
            if (cellDate.getMonth() !== month) {
                cell.style.color = '#ccc';
            }
            
            // 過去の日付は無効化
            if (cellDate < new Date().setHours(0, 0, 0, 0)) {
                cell.classList.add('disabled');
            }
            
            // 選択された日付をハイライト
            if (this.selectedDates.checkin && this.isSameDate(cellDate, this.selectedDates.checkin)) {
                cell.classList.add('selected');
            }
            if (this.selectedDates.checkout && this.isSameDate(cellDate, this.selectedDates.checkout)) {
                cell.classList.add('selected');
            }
            
            // 予約済み日付の確認（実装時に追加）
            if (this.isDateBooked(cellDate)) {
                cell.classList.add('disabled');
                cell.title = '予約済み';
            }
            
            calendar.appendChild(cell);
        }
    }

    isSameDate(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    isDateBooked(date) {
        // 実際の実装では選択された物件の予約状況をチェック
        return false;
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        this.showLoading(true);
        
        try {
            const formData = this.collectFormData();
            
            // 予約をGoogle Calendarに追加
            await this.createCalendarEvent(formData);
            
            // 確認メールを送信
            await this.sendConfirmationEmail(formData);
            
            this.showMessage('予約が完了しました！確認メールをお送りしましたのでご確認ください。', 'success');
            this.resetForm();
            
        } catch (error) {
            console.error('Booking submission failed:', error);
            this.showMessage('予約処理中にエラーが発生しました。お手数ですが、もう一度お試しください。', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    collectFormData() {
        const nights = Math.ceil((this.selectedDates.checkout - this.selectedDates.checkin) / (1000 * 60 * 60 * 24));
        const basePrice = nights * this.selectedProperty.price;
        const totalPrice = basePrice + 3000;

        return {
            property: {
                id: this.selectedProperty.id,
                name: document.querySelector(`input[value="${this.selectedProperty.id}"]`).closest('.property-card').querySelector('.property-name').textContent
            },
            dates: {
                checkin: this.selectedDates.checkin,
                checkout: this.selectedDates.checkout,
                nights: nights
            },
            guests: parseInt(document.getElementById('guests').value),
            customer: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value
            },
            requests: document.getElementById('requests').value,
            pricing: {
                basePrice: basePrice,
                cleaningFee: 3000,
                totalPrice: totalPrice
            },
            bookingId: this.generateBookingId()
        };
    }

    generateBookingId() {
        return 'BK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    async createCalendarEvent(formData) {
        const calendarIds = {
            'fujimi': 'YOUR_FUJIMI_CALENDAR_ID@group.calendar.google.com',    // Step 5.2で取得
            'quriu': 'YOUR_QURIU_CALENDAR_ID@group.calendar.google.com',      // Step 5.2で取得  
            'studio': 'YOUR_STUDIO_CALENDAR_ID@group.calendar.google.com'     // Step 5.2で取得
        };

        const calendarId = calendarIds[formData.property.id];
        
        const event = {
            summary: `${formData.customer.lastName} ${formData.customer.firstName} 様 (${formData.guests}名)`,
            description: `
予約ID: ${formData.bookingId}
物件: ${formData.property.name}
人数: ${formData.guests}名
連絡先: ${formData.customer.email} / ${formData.customer.phone}
特別要望: ${formData.requests || 'なし'}
合計金額: ¥${formData.pricing.totalPrice.toLocaleString()}
            `.trim(),
            start: {
                date: this.formatDate(formData.dates.checkin)
            },
            end: {
                date: this.formatDate(formData.dates.checkout)
            },
            attendees: [{
                email: formData.customer.email,
                displayName: `${formData.customer.lastName} ${formData.customer.firstName}`
            }]
        };

        const response = await gapi.client.calendar.events.insert({
            calendarId: calendarId,
            resource: event
        });

        return response.result;
    }

    async sendConfirmationEmail(formData) {
        const customerEmailBody = this.generateCustomerEmailBody(formData);
        const ownerEmailBody = this.generateOwnerEmailBody(formData);

        // お客様への確認メール
        await this.sendEmail(
            formData.customer.email,
            `【8WEEKS FUJIMI】予約確認 - ${formData.bookingId}`,
            customerEmailBody
        );

        // オーナーへの通知メール
        await this.sendEmail(
            'your-email@gmail.com', // 実際のオーナーメールアドレスに変更してください
            `【新規予約】${formData.property.name} - ${formData.bookingId}`,
            ownerEmailBody
        );
    }

    generateCustomerEmailBody(formData) {
        return `
${formData.customer.lastName} ${formData.customer.firstName} 様

この度は8WEEKS FUJIMIをご予約いただき、誠にありがとうございます。
以下、ご予約内容をご確認ください。

━━━━━━━━━━━━━━━━━━━━━━━━
【予約確認書】
━━━━━━━━━━━━━━━━━━━━━━━━

■ 予約ID: ${formData.bookingId}

■ 宿泊施設
${formData.property.name}

■ ご宿泊日程
チェックイン: ${formData.dates.checkin.toLocaleDateString('ja-JP')}
チェックアウト: ${formData.dates.checkout.toLocaleDateString('ja-JP')}
宿泊数: ${formData.dates.nights}泊

■ ご利用人数
${formData.guests}名

■ 料金
宿泊料金: ¥${formData.pricing.basePrice.toLocaleString()}
清掃料金: ¥${formData.pricing.cleaningFee.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━
合計: ¥${formData.pricing.totalPrice.toLocaleString()}

■ 特別なご要望
${formData.requests || 'なし'}

━━━━━━━━━━━━━━━━━━━━━━━━

チェックイン詳細やアクセス方法については、ご宿泊日が近づきましたら
改めてご連絡させていただきます。

ご質問等ございましたら、お気軽にお問い合わせください。
八ヶ岳での素敵なひとときをお過ごしいただけるよう
心よりお待ちしております。

8WEEKS FUJIMI
Instagram: @8weeks.fujimi
        `.trim();
    }

    generateOwnerEmailBody(formData) {
        return `
新規予約が入りました。

予約ID: ${formData.bookingId}
物件: ${formData.property.name}
日程: ${formData.dates.checkin.toLocaleDateString('ja-JP')} - ${formData.dates.checkout.toLocaleDateString('ja-JP')} (${formData.dates.nights}泊)
人数: ${formData.guests}名
金額: ¥${formData.pricing.totalPrice.toLocaleString()}

【お客様情報】
お名前: ${formData.customer.lastName} ${formData.customer.firstName}
メール: ${formData.customer.email}
電話: ${formData.customer.phone}

【特別要望】
${formData.requests || 'なし'}

Googleカレンダーにも自動登録されています。
        `.trim();
    }

    async sendEmail(to, subject, body) {
        const email = [
            'Content-Type: text/plain; charset="UTF-8"\n',
            'MIME-Version: 1.0\n',
            'Content-Transfer-Encoding: 7bit\n',
            `to: ${to}\n`,
            `subject: ${subject}\n\n`,
            body
        ].join('');

        const encodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, '-').replace(/\//g, '_');

        const response = await gapi.client.gmail.users.messages.send({
            userId: 'me',
            resource: {
                raw: encodedEmail
            }
        });

        return response.result;
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type} show`;
        
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }

    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        const formEl = document.getElementById('bookingForm');
        
        if (show) {
            loadingEl.classList.add('show');
            formEl.style.opacity = '0.5';
            formEl.style.pointerEvents = 'none';
        } else {
            loadingEl.classList.remove('show');
            formEl.style.opacity = '1';
            formEl.style.pointerEvents = 'auto';
        }
    }

    resetForm() {
        document.getElementById('bookingForm').reset();
        document.querySelectorAll('.property-card').forEach(card => {
            card.classList.remove('selected');
        });
        this.selectedProperty = null;
        this.selectedDates = { checkin: null, checkout: null };
        this.validateForm();
        this.calculatePrice();
        this.renderCalendar();
    }
}

// フォーム要素の変更監視（リアルタイムバリデーション）
document.addEventListener('DOMContentLoaded', () => {
    const bookingSystem = new BookingSystem();
    
    // リアルタイムバリデーション
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            bookingSystem.validateForm();
        });
    });
});

// Google APIが利用できない場合のフォールバック
window.addEventListener('load', () => {
    // Google APIの読み込みに失敗した場合のハンドリング
    setTimeout(() => {
        if (typeof gapi === 'undefined') {
            console.warn('Google APIs not loaded, using fallback mode');
            document.getElementById('message').innerHTML = `
                <div class="message warning show">
                    現在Google API連携が利用できません。<br>
                    お手数ですが、下記までお電話にてご予約ください：<br>
                    <strong>Tel: 0266-XX-XXXX</strong>
                </div>
            `;
        }
    }, 3000);
});