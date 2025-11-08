// تكوين Firebase - معدل
const firebaseConfig = {
    apiKey: "AIzaSyD3JAkLqDasFoqChKxFp9JsJZjPGCelJzc",
    authDomain: "rcloud-efb73.firebaseapp.com",
    projectId: "rcloud-efb73",
    storageBucket: "rcloud-efb73.appspot.com", // ⬅️ تم التصحيح هنا
    messagingSenderId: "725249738242",
    appId: "1:725249738242:web:18372ce51017f0c05b891b"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

// العناصر
let uploadArea, fileInput, filesList, totalFiles, totalSize;

// عندما تكون الصفحة جاهزة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // تعريف العناصر
    uploadArea = document.getElementById('uploadArea');
    fileInput = document.getElementById('fileInput');
    filesList = document.getElementById('filesList');
    totalFiles = document.getElementById('totalFiles');
    totalSize = document.getElementById('totalSize');
    
    console.log('🔥 Rcloud جاهز للعمل!');
    console.log('📦 Storage Bucket:', firebaseConfig.storageBucket);
    
    // إعداد الأحداث
    setupEvents();
    
    // تحميل الملفات
    loadFiles();
}

// إعداد الأحداث
function setupEvents() {
    // زر التحديث
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadFiles);
    }
    
    // أحداث الرفع
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
    
    // حدث اختيار الملفات
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

// معالجة الملفات
function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    for (let file of files) {
        if (file.size > 50 * 1024 * 1024) { // 50MB حد
            alert(`الملف ${file.name} أكبر من 50MB`);
            continue;
        }
        uploadFile(file);
    }
}

// رفع الملف
function uploadFile(file) {
    console.log('📤 بدء رفع:', file.name);
    
    const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + file.name;
    const storageRef = storage.ref().child('files/' + fileId);
    
    const uploadTask = storageRef.put(file);

    // إنشاء عنصر الملف
    const fileItem = createFileItem(file.name, fileId, file.size, 'جاري الرفع...');
    
    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const progressBar = fileItem.querySelector('.progress');
            progressBar.style.width = progress + '%';
        },
        (error) => {
            console.error('❌ خطأ في الرفع:', error);
            fileItem.style.background = '#f8d7da';
            fileItem.querySelector('.file-date').textContent = 'فشل الرفع';
            alert('خطأ في رفع الملف: ' + error.message);
        },
        async () => {
            console.log('✅ اكتمل رفع:', file.name);
            fileItem.style.background = '#d4edda';
            const metadata = await storageRef.getMetadata();
            const uploadDate = new Date(metadata.timeCreated).toLocaleDateString('ar-SA');
            fileItem.querySelector('.file-date').textContent = uploadDate;
            loadFiles();
            updateStats();
        }
    );
}

// إنشاء عنصر ملف
function createFileItem(fileName, fileId, fileSize, date) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
        <div class="file-info">
            <span class="file-icon">📄</span>
            <div class="file-details">
                <span class="file-name">${fileName}</span>
                <span class="file-size">${formatFileSize(fileSize)}</span>
                <span class="file-date">${date}</span>
            </div>
        </div>
        <div class="file-actions">
            <button class="btn btn-download" data-fileid="${fileId}" data-filename="${fileName}">
                ⬇️ تحميل
            </button>
            <button class="btn btn-share" data-fileid="${fileId}" data-filename="${fileName}">
                🔗 مشاركة
            </button>
            <button class="btn btn-delete" data-fileid="${fileId}">
                🗑️ حذف
            </button>
        </div>
        <div class="progress-bar">
            <div class="progress"></div>
        </div>
    `;
    
    // إضافة الأحداث للأزرار
    const downloadBtn = fileItem.querySelector('.btn-download');
    const shareBtn = fileItem.querySelector('.btn-share');
    const deleteBtn = fileItem.querySelector('.btn-delete');
    
    downloadBtn.addEventListener('click', () => downloadFile(fileId, fileName));
    shareBtn.addEventListener('click', () => shareFile(fileId, fileName));
    deleteBtn.addEventListener('click', () => deleteFile(fileId));
    
    filesList.prepend(fileItem);
    return fileItem;
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// تحميل الملف
async function downloadFile(fileId, fileName) {
    try {
        const storageRef = storage.ref().child('files/' + fileId);
        const url = await storageRef.getDownloadURL();
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
    } catch (error) {
        console.error('❌ خطأ في التحميل:', error);
        alert('خطأ في تحميل الملف');
    }
}

// مشاركة الملف
async function shareFile(fileId, fileName) {
    try {
        const storageRef = storage.ref().child('files/' + fileId);
        const url = await storageRef.getDownloadURL();
        
        await navigator.clipboard.writeText(url);
        alert('✅ تم نسخ رابط المشاركة');
    } catch (error) {
        console.error('❌ خطأ في المشاركة:', error);
        alert('خطأ في إنشاء رابط المشاركة');
    }
}

// حذف الملف
async function deleteFile(fileId) {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا الملف؟')) {
        try {
            const storageRef = storage.ref().child('files/' + fileId);
            await storageRef.delete();
            loadFiles();
            updateStats();
        } catch (error) {
            console.error('❌ خطأ في الحذف:', error);
            alert('خطأ في حذف الملف');
        }
    }
}

// تحميل الملفات
async function loadFiles() {
    try {
        console.log('🔄 جاري تحميل الملفات...');
        const listRef = storage.ref().child('files');
        const result = await listRef.listAll();
        
        filesList.innerHTML = '';
        console.log('📁 عدد الملفات:', result.items.length);
        
        for (let item of result.items) {
            const metadata = await item.getMetadata();
            const fileName = metadata.name.split('-').slice(2).join('-');
            const uploadDate = new Date(metadata.timeCreated).toLocaleDateString('ar-SA');
            createFileItem(fileName, metadata.name, metadata.size, uploadDate);
        }
        
        updateStats();
    } catch (error) {
        console.error('❌ خطأ في تحميل الملفات:', error);
    }
}

// تحديث الإحصائيات
async function updateStats() {
    try {
        const listRef = storage.ref().child('files');
        const result = await listRef.listAll();
        
        let totalSizeBytes = 0;
        for (let item of result.items) {
            const metadata = await item.getMetadata();
            totalSizeBytes += metadata.size;
        }
        
        totalFiles.textContent = result.items.length;
        totalSize.textContent = formatFileSize(totalSizeBytes);
    } catch (error) {
        console.error('❌ خطأ في الإحصائيات:', error);
    }
}
