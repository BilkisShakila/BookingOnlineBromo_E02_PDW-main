
## 1. Use Case Diagram
```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle

actor "Pelanggan (Customer)" as Customer
actor "Administrator (Admin)" as Admin

rectangle "Sistem Booking Bromo" {
  usecase "Registrasi Akun" as UC1
  usecase "Login" as UC2
  usecase "Lihat Paket Wisata & Detail" as UC3
  usecase "Melakukan Pemesanan Paket" as UC4
  usecase "Upload Bukti Pembayaran" as UC5
  usecase "Lihat Riwayat & Status Pemesanan" as UC6
  usecase "Kelola Paket Wisata (CRUD)" as UC7
  usecase "Kelola & Verifikasi Pemesanan" as UC8
}

Customer --> UC1
Customer --> UC2
Customer --> UC3
Customer --> UC4
Customer --> UC5
Customer --> UC6

Admin --> UC2
Admin --> UC7
Admin --> UC8
@endum
```

---

## 2. Activity Diagram
```plantuml
@startuml
start
:Buka Website Booking Bromo;
:Lihat Daftar Paket Wisata;
:Pilih Paket Wisata & Klik Pesan;

if (Apakah Sudah Login?) then (Belum)
  :Registrasi / Login Akun;
else (Sudah)
endif

:Isi Form Pemesanan;
:Kirim Pemesanan;
:Sistem Menyimpan Pemesanan\n(Status: Pending);
:Tampilkan Informasi Rekening Pembayaran;
:Pelanggan Melakukan Transfer;
:Pelanggan Upload Bukti Pembayaran;
:Notifikasi Masuk ke Admin;

if (Admin Verifikasi Bukti?) then (Valid)
  :Update Status: Approved\nTerbitkan Konfirmasi/E-Ticket;
else (Tidak Valid)
  :Update Status: Rejected\nBerikan Alasan Penolakan;
endif

stop
@endum
```

---

## 3. Architecture Diagram
```plantuml
@startuml
package "Client Side (Web Browser)" {
  [User Interface (HTML/CSS)] as UI
  [Fetch API / Form Submission] as Fetch
}

package "Server Side (Node.js & Express)" {
  [Express Router] as Router
  [Auth Middleware & Multer] as Middleware
  [Controllers] as Controllers
  [EJS Views Engine] as EJS
}

package "Data & Storage Layer" {
  database "MySQL DB (XAMPP)" as MySQL
  folder "/public/uploads/" as Storage
}

UI --> Router : HTTP Request
Router --> Middleware : Route Request
Middleware --> Controllers : Pass Request
Controllers --> EJS : Render View
EJS --> UI : HTML Response
Controllers --> MySQL : SQL Query
Controllers --> Storage : Save Files
@endum
```

---

## 4. Class Diagram
```plantuml
@startuml
class User {
  + int id
  + string username
  + string email
  + string password
  + string phone
  + string role
  + date created_at
  + register(data)
  + login(username, password)
  + getProfile(id)
}

class Package {
  + int id
  + string name
  + string description
  + double price_per_person
  + string image_url
  + date created_at
  + createPackage(data)
  + updatePackage(id, data)
  + deletePackage(id)
  + getAllPackages()
  + getPackageById(id)
}

class Booking {
  + int id
  + int user_id
  + int package_id
  + date booking_date
  + date travel_date
  + int total_participants
  + double total_price
  + string status
  + date created_at
  + createBooking(data)
  + cancelBooking(id)
  + updateStatus(id, newStatus)
  + getBookingsByUser(userId)
  + getAllBookings()
}

class Payment {
  + int id
  + int booking_id
  + double amount_paid
  + string bank_name
  + string account_holder
  + string payment_proof_url
  + string status
  + date created_at
  + uploadProof(data)
  + verifyPayment(id, status)
}

User "1" -- "0..*" Booking : makes
Package "1" -- "0..*" Booking : booked_in
Booking "1" -- "0..1" Payment : has
@endum
```

---

## 5. Mapping Table (Class ke DB)
```plantuml
@startuml
title Pemetaan Atribut Kelas ke Kolom Database (MySQL)

object MappingTable

note right of MappingTable
  |= Class |= Attribute |= Database Table |= Database Column |= Data Type |= Constraints |
  | **User** | id | users | id | INT | PRIMARY KEY, AUTO_INCREMENT |
  | | username | users | username | VARCHAR(100) | UNIQUE, NOT NULL |
  | | email | users | email | VARCHAR(150) | UNIQUE, NOT NULL |
  | | password | users | password | VARCHAR(255) | NOT NULL (Hashed) |
  | | phone | users | phone | VARCHAR(20) | NOT NULL |
  | | role | users | role | ENUM('admin','customer')| DEFAULT 'customer', NOT NULL |
  | | created_at | users | created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
  |--|--|--|--|--|--|
  | **Package**| id | packages | id | INT | PRIMARY KEY, AUTO_INCREMENT |
  | | name | packages | name | VARCHAR(150) | NOT NULL |
  | | description| packages | description | TEXT | NOT NULL |
  | | price_per_person| packages | price_per_person | DECIMAL(10,2) | NOT NULL |
  | | image_url | packages | image_url | VARCHAR(255) | NOT NULL |
  | | created_at | packages | created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
  |--|--|--|--|--|--|
  | **Booking**| id | bookings | id | INT | PRIMARY KEY, AUTO_INCREMENT |
  | | user_id | bookings | user_id | INT | FOREIGN KEY REFERENCES users(id) |
  | | package_id | bookings | package_id | INT | FOREIGN KEY REFERENCES packages(id) |
  | | travel_date | bookings | travel_date | DATE | NOT NULL |
  | | total_participants| bookings | total_participants| INT | NOT NULL |
  | | total_price | bookings | total_price | DECIMAL(10,2) | NOT NULL |
  | | status | bookings | status | ENUM('pending',...) | DEFAULT 'pending', NOT NULL |
  |--|--|--|--|--|--|
  | **Payment**| id | payments | id | INT | PRIMARY KEY, AUTO_INCREMENT |
  | | booking_id | payments | booking_id | INT | FOREIGN KEY REFERENCES bookings(id) |
  | | amount_paid| payments | amount_paid | DECIMAL(10,2) | NOT NULL |
  | | bank_name | payments | bank_name | VARCHAR(50) | NOT NULL |
  | | account_holder| payments | account_holder| VARCHAR(100) | NOT NULL |
  | | payment_proof_url| payments | payment_proof_url| VARCHAR(255) | NOT NULL |
  | | status | payments | status | ENUM('pending',...) | DEFAULT 'pending', NOT NULL |
end note
@endum
```

---

## 6. Resume Class, Attribute, dan Operation
```plantuml
@startuml
title Rangkuman Deskripsi Class, Atribut, dan Operasi

object ResumeClass

note right of ResumeClass
  |= Class |= Deskripsi |= Atribut Utama |= Operasi Utama (Method) |
  | **User** | Mengelola kredensial dan sesi profil user | id, username, email, password, phone, role | + register(data), + login(user, pass), + getProfile(id) |
  | **Package** | Mengelola CRUD paket wisata Bromo | id, name, description, price_per_person, image_url | + create(data), + update(id, data), + delete(id), + getAll() |
  | **Booking** | Menangani data reservasi tour oleh customer | id, user_id, package_id, travel_date, participants, price | + create(data), + cancel(id, userId), + updateStatus(id, status) |
  | **Payment** | Menangani data transfer & bukti pembayaran | id, booking_id, amount_paid, bank, holder, proof_url | + uploadProof(data), + verifyPayment(id, status) |
end note
@endum
```

---

## 7. Skeleton Kode (Struktur File Proyek)
```plantuml
@startuml
title Struktur Direktori & File Proyek (Skeleton)

package "booking-online-bromo (Root)" {
  [server.js (Main Entry)]
  [.env (Environment Config)]
  [package.json (Dependencies)]
  
  package "config" {
    [db.js (Database Config)]
  }
  
  package "models" {
    [UserModel.js]
    [PackageModel.js]
    [BookingModel.js]
    [PaymentModel.js]
  }
  
  package "controllers" {
    [AuthController.js]
    [PackageController.js]
    [BookingController.js]
    [AdminController.js]
  }
  
  package "routes" {
    [authRoutes.js]
    [packageRoutes.js]
    [bookingRoutes.js]
    [adminRoutes.js]
  }
  
  package "views" {
    [index.ejs (Landing Page)]
    [booking.ejs (Form Booking)]
    [history.ejs (Riwayat & Upload Bukti)]
    [login.ejs]
    [register.ejs]
    [package-detail.ejs]
    
    package "admin" {
      [dashboard.ejs]
      [packages.ejs]
    }
    package "partials" {
      [header.ejs]
      [footer.ejs]
    }
  }
  
  package "public" {
    package "css" {
      [style.css (Design System)]
    }
    package "js" {
      [main.js]
    }
    package "uploads" {
      [proof-images...]
    }
  }
}
@endum
```

---

## 8. Sequence Diagram
```plantuml
@startuml
autonumber
actor Customer as "Pelanggan"
boundary UI as "Browser / Frontend"
control Server as "Express Server"
database DB as "MySQL DB (XAMPP)"
actor Admin as "Administrator"

Customer -> UI: Pilih Paket & Klik Pesan
UI -> Server: POST /booking (Data Pemesanan, Sesi)
note over Server: Validasi Sesi & Request Body
Server -> DB: INSERT INTO bookings (user_id, package_id, travel_date, dll)
DB --> Server: Kembalikan Booking ID
Server --> UI: Response (Status: 201 Created, Booking ID)
UI --> Customer: Tampilkan Detail Pembayaran & Form Upload Bukti

Customer -> UI: Upload Bukti Bayar & Klik Submit
UI -> Server: POST /booking/:id/payment (Bukti File + Data Form)
note over Server: Multer menaruh file di /public/uploads/
Server -> DB: INSERT INTO payments (booking_id, amount_paid, payment_proof_url, dll)
Server -> DB: UPDATE bookings SET status = 'waiting_verification' WHERE id = booking_id
DB --> Server: Sukses Update
Server --> UI: Response (Pembayaran diupload, menunggu verifikasi)
UI --> Customer: Tampilkan Status: Menunggu Verifikasi

Admin -> UI: Buka Dashboard Admin / Kelola Booking
UI -> Server: GET /admin/bookings
Server -> DB: SELECT * FROM bookings WHERE status = 'waiting_verification'
DB --> Server: Kembalikan Data Booking & Pembayaran
Server --> UI: Render Halaman Dashboard (Daftar Booking)
UI --> Admin: Tampilkan Daftar Bukti Pembayaran

Admin -> UI: Klik Setujui (Approve) Pembayaran
UI -> Server: POST /admin/booking/:id/approve
Server -> DB: UPDATE bookings SET status = 'approved' WHERE id = booking_id
Server -> DB: UPDATE payments SET status = 'verified' WHERE booking_id = booking_id
DB --> Server: Sukses Update
Server --> UI: Response (Booking Berhasil Disetujui)
UI --> Admin: Tampilkan Pembaruan Status Sukses
UI --> Customer: (Refresh) Status: Approved (E-Ticket Terbit)
@endum
```

---

## 9. ERD / Database Design
```plantuml
@startuml
skinparam linetype ortho

entity "users" {
  * id : INT <<PK>> [AUTO_INCREMENT]
  --
  * username : VARCHAR(100) <<UNIQUE>>
  * email : VARCHAR(150) <<UNIQUE>>
  * password : VARCHAR(255)
  * phone : VARCHAR(20)
  * role : ENUM('admin', 'customer')
  * created_at : TIMESTAMP
}

entity "packages" {
  * id : INT <<PK>> [AUTO_INCREMENT]
  --
  * name : VARCHAR(150)
  * description : TEXT
  * price_per_person : DECIMAL(10,2)
  * image_url : VARCHAR(255)
  * created_at : TIMESTAMP
}

entity "bookings" {
  * id : INT <<PK>> [AUTO_INCREMENT]
  --
  * user_id : INT <<FK>>
  * package_id : INT <<FK>>
  * travel_date : DATE
  * total_participants : INT
  * total_price : DECIMAL(10,2)
  * status : ENUM('pending', 'waiting_verification', 'approved', 'rejected', 'cancelled')
  * booking_date : TIMESTAMP
  * created_at : TIMESTAMP
}

entity "payments" {
  * id : INT <<PK>> [AUTO_INCREMENT]
  --
  * booking_id : INT <<FK>>
  * amount_paid : DECIMAL(10,2)
  * bank_name : VARCHAR(50)
  * account_holder : VARCHAR(100)
  * payment_proof_url : VARCHAR(255)
  * status : ENUM('pending', 'verified', 'failed')
  * created_at : TIMESTAMP
}

users ||--o{ bookings : "places"
packages ||--o{ bookings : "includes"
bookings ||--o| payments : "has_payment"
@endum
```
