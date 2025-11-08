// تكوين Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD3JAkLqDasFoqChKxFp9JsJZjPGCelJzc",
    authDomain: "rcloud-efb73.firebaseapp.com",
    projectId: "rcloud-efb73",
    storageBucket: "rcloud-efb73.firebasestorage.app",
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
    
    // التحقق من وجود العناصر
    if (!uploadArea || !fileInput) {
        console.error('عناصر الرفع غير موجودة!');
        return;
    }
    
    console.log('التطبيق جاهز للرفع...');
    
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
        console.log('النقر على منطقة الرفع');
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
        console.log('تم إفلات الملفات:', e.dataTransfer.files.length);
        handleFiles(e.dataTransfer.files);
    });
    
    // حدث اختيار الملفات
    fileInput.addEventListener('change', (e) => {
        console.log('تم اختيار الملفات:', e.target.files.length);
        handleFiles(e.target.files);
    });
}

// معالجة الملفات
function handleFiles(files) {
    if (!files || files.length === 0) {
        console.log('لا توجد ملفات');
        return;
    }
    
    console.log('معالجة', files.length, 'ملف');
    
    for (let file of files) {
        if (file.size > 100 * 1024 * 1024) {
            alert(`الملف ${file.name} أكبر من 100MB`);
            continue;
        }
        uploadFile(file);
    }
}

// رفع الملف
function uploadFile(file) {
    console.log('بدء رفع الملف:', file.name);
    
    const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9) + '-' + file.name;
    const storageRef = storage.ref().child('files/' + fileId);
    
    console.log('المرجع:', storageRef.fullPath);
    
    const uploadTask = storageRef.put(file);

    // إنشاء عنصر الملف
    const fileItem = createFileItem(file.name, fileId, file.size, 'جاري الرفع...');
    
    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            const progressBar = fileItem.querySelector('.progress');
            progressBar.style.width = progress + '%';
            console.log('التقدم:', progress + '%');
        },
        (error) => {
            console.error('خطأ في الرفع:', error);
            fileItem.style.background = '#f8d7da';
            fileItem.querySelector('.file-date').textContent = 'فشل الرفع';
            alert('❌ خطأ في رفع الملف: ' + error.message);
        },
        async () => {
            console.log('✅ اكتمل رفع الملف:', file.name);
            fileItem.style.background = '#d4edda';
            try {
                const metadata = await storageRef.getMetadata();
                const uploadDate = new Date(metadata.timeCreated).toLocaleDateString('ar-SA');
                fileItem.querySelector('.file-date').textContent = uploadDate;
                loadFiles();
                updateStats();
            } catch (error) {
                console.error('خطأ في الحصول على الميتاداتا:', error);
            }
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
        console.log('بدء تحميل الملف:', fileId);
        const storageRef = storage.ref().child('files/' + fileId);
        const url = await storageRef.getDownloadURL();
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        console.log('✅ اكتمل التحميل');
    } catch (error) {
        console.error('خطأ في التحميل:', error);
        alert('❌ خطأ في تحميل الملف: ' + error.message);
    }
}

// مشاركة الملف
async function shareFile(fileId, fileName) {
    try {
        console.log('بدء مشاركة الملف:', fileId);
        const storageRef = storage.ref().child('files/' + fileId);
        const url = await storageRef.getDownloadURL();
        
        await navigator.clipboard.writeText(url);
        alert('✅ تم نسخ رابط المشاركة');
    } catch (error) {
        console.error('خطأ في المشاركة:', error);
        alert('❌ خطأ في إنشاء رابط المشاركة: ' + error.message);
    }
}

// حذف الملف
async function deleteFile(fileId) {
    if (confirm('⚠️ هل أنت متأكد من حذف هذا الملف؟')) {
        try {
            console.log('بدء حذف الملف:', fileId);
            const storageRef = storage.ref().child('files/' + fileId);
            await storageRef.delete();
            loadFiles();
            updateStats();
            console.log('✅ اكتمل الحذف');
        } catch (error) {
            console.error('خطأ في الحذف:', error);
            alert('❌ خطأ في حذف الملف: ' + error.message);
        }
    }
}

// تحميل الملفات
async function loadFiles() {
    try {
        console.log('جاري تحميل الملفات...');
        const listRef = storage.ref().child('files');
        const result = await listRef.listAll();
        
        filesList.innerHTML = '';
        console.log('تم العثور على', result.items.length, 'ملف');
        
        for (let item of result.items) {
            try {
                const metadata = await item.getMetadata();
                const fileName = metadata.name.split('-').slice(2).join('-');
                const uploadDate = new Date(metadata.timeCreated).toLocaleDateString('ar-SA');
                createFileItem(fileName, metadata.name, metadata.size, uploadDate);
            } catch (error) {
                console.error('خطأ في تحميل ملف:', error);
            }
        }
        
        updateStats();
    } catch (error) {
        console.error('خطأ في تحميل الملفات:', error);
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
        console.error('خطأ في تحديث الإحصائيات:', error);
    }
}
