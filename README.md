# Monster Match

Game nối quái 2D xây dựng bằng **PixiJS** và **Vite**. Người chơi kéo để nối ít nhất ba quái liền kề cùng loại, nhận điểm, nạp target và kích hoạt kỹ năng của từng quái.

## Chạy dự án

Yêu cầu: Node.js 18 trở lên.

```bash
npm install
npm run dev
```

Sau đó mở địa chỉ do Vite hiển thị trong terminal, thường là `http://localhost:5173`.

Để tạo production bundle:

```bash
npx vite build
```

> `npm run build` hiện chạy ESLint trước khi build. Cấu hình ESLint hiện tại còn dùng `extends` theo kiểu cũ nên lệnh lint sẽ báo lỗi; điều này không ảnh hưởng đến việc chạy game hoặc tạo bundle bằng `npx vite build`.

## Cách chơi

1. Nhấn **START** ở màn hình chính.
2. Kéo qua các quái cùng loại liền kề để tạo chuỗi từ 3 quái trở lên.
3. Mỗi quái trong chuỗi cho 1 điểm cơ bản và tăng tiến độ target tương ứng.
4. Khi target của một loại quái đạt 20, kỹ năng của loại đó được kích hoạt ngay.
5. Hết thời gian, ván chơi kết thúc và người chơi có thể Retry hoặc về Home.

Ô Score và Time có hiệu ứng phản hồi phần thưởng: ví dụ `110 +3` sẽ chuyển thành `113` sau một nhịp ngắn.

## Kỹ năng quái

| Quái | Kỹ năng |
| --- | --- |
| CAT | Cộng 10 giây vào thời gian còn lại. |
| PIG | Cộng 20 điểm. |
| SHEEP | Các Sheep trên board nhận x2 điểm trong 20 giây. Owl nối cùng Sheep cũng nhận hệ số này. |
| RABBIT | Xóa toàn bộ Rabbit trên board và cộng điểm cho mỗi Rabbit bị xóa. |
| OWL | Trong 20 giây có thể nối với bất kỳ loại quái nào. Owl liên tục đổi hình; khi hiệu lực kết thúc sẽ trở về Owl. Owl đang kích hoạt không được nạp thêm vào target. |

## Tính năng giao diện

- Start, Gameplay, Pause và Result state.
- Responsive cho desktop và điện thoại; background riêng cho màn hình mobile.
- Pause thủ công bằng nút Pause, hoặc tự động khi đổi tab/rời cửa sổ.
- Target có thanh fill, countdown kỹ năng và phản hồi khi kích hoạt.
- Đường nối quái có glow cùng hạt VFX chạy dọc đường.
- Nhạc nền riêng cho gameplay và result; sound effect cho match, match fail, thời gian thấp và game over.
- Khi còn ít thời gian, ô Time chuyển đỏ và đập nhanh hơn.

## Cấu trúc mã nguồn

```text
src/
├── config/
│   └── GameConfig.js            # Thời gian, board, target và thông số skill
├── core/
│   ├── GameManager.js           # Singleton quản lý app, state machine và audio
│   └── StateMachine.js
├── game/
│   ├── controllers/
│   │   ├── MatchController.js   # Match, điểm, target, skill và refill
│   │   └── PauseController.js   # Pause, ticker, input và popup
│   ├── layout/
│   │   └── GameplayLayout.js    # Bố cục desktop/mobile/compact
│   ├── skills/                  # Kỹ năng theo từng loại quái
│   ├── Board.js
│   ├── InputController.js
│   └── LinkRenderer.js
├── services/
│   ├── AssetLoader.js
│   └── AudioManager.js
├── states/
│   ├── StartState.js
│   ├── GameplayState.js         # Điều phối vòng đời một ván chơi
│   └── ResultState.js
└── ui/
    ├── components/
    ├── HudLayout.js
    └── UIManager.js
```

## Cấu hình gameplay

Các thông số chính nằm trong [`src/config/GameConfig.js`](src/config/GameConfig.js):

- Thời gian ván: 150 giây.
- Cảnh báo thời gian thấp: 30 giây.
- Target mỗi loại quái: 20.
- Board: 8 hàng × 8 cột.
- Skill Sheep và Owl: 20 giây.

## Tài nguyên

- Hình ảnh, background, nút và sprite quái: `public/assets/`.
- Âm thanh: `public/sounds/`.
- Script chuẩn hóa animation frame quái: `scripts/normalize_monsters.py`.

## Ghi chú phát triển

- `GameManager` là singleton cấp ứng dụng và sở hữu một `AudioManager`.
- `UIManager` quản lý HUD; các component nhỏ chịu trách nhiệm hiển thị riêng.
- `GameplayState` chỉ điều phối vòng đời. Logic match, pause và responsive đã được tách để dễ mở rộng theo nguyên tắc SOLID.
