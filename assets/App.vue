<template>
  <div class="main" @dragenter.prevent @dragover.prevent @drop.prevent="onDrop">
    <progress
      v-if="uploadProgress !== null"
      :value="uploadProgress"
      max="100"
    ></progress>
    <UploadPopup
      v-model="showUploadPopup"
      @upload="onUploadClicked"
      @createFolder="createFolder"
    ></UploadPopup>
    <button class="upload-button circle" @click="showUploadPopup = true">
      <img
        style="filter: invert(100%)"
        src="https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/4.0.0/png/file/upload_file/materialicons/36dp/2x/baseline_upload_file_black_36dp.png"
        alt="Upload"
        width="36"
        height="36"
        @contextmenu.prevent
      />
    </button>
    <div class="app-bar">
      <input type="search" v-model="search" aria-label="Search" />
      <div class="menu-button">
        <button class="circle" @click="showMenu = true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            width="24"
            height="24"
            title="Menu"
            style="display: block; margin: 4px"
          >
            <!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
            <path
              d="M120 256c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm160 0c0 30.9-25.1 56-56 56s-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56zm104 56c-30.9 0-56-25.1-56-56s25.1-56 56-56s56 25.1 56 56s-25.1 56-56 56z"
            />
          </svg>
        </button>
        <Menu
          v-model="showMenu"
          :items="[{ text: '名称A-Z' }, { text: '大小↑' } ,{ text: '大小↓' }, { text: '粘贴' }]"
          @click="onMenuClick"
        />
      </div>
    </div>
    <ul class="file-list">
      <li v-if="cwd !== ''" class="parent-dir-item">
        <div
          tabindex="0"
          class="file-item parent-dir"
          @click="cwd = cwd.replace(/[^\/]+\/$/, '')"
          @contextmenu.prevent
        >
          <div class="file-icon folder-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4L4 12h3v8h10v-8h3L12 4z"/>
              <path d="M12 2a10 10 0 0 0-10 10v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a10 10 0 0 0-10-10z"/>
            </svg>
          </div>
          <span class="file-name">..</span>
          <span class="file-hint">返回上级目录</span>
        </div>
      </li>
      <li v-for="folder in filteredFolders" :key="folder">
        <div
          tabindex="0"
          class="file-item folder-item"
          @click="cwd = folder"
          @contextmenu.prevent="
            showContextMenu = true;
            focusedItem = folder;
          "
        >
          <div class="file-icon folder-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
          </div>
          <span class="file-name" v-text="folder.match(/.*?([^/]*)\/?$/)[1]"></span>
          <button class="more-btn" @click.stop="showContextMenu = true; focusedItem = folder;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </li>
      <li v-for="file in filteredFiles" :key="file.key">
        <div
          class="file-item file-item-row"
          @click="preview(`/raw/${file.key}`)"
          @contextmenu.prevent="showContextMenu = true; focusedItem = file;"
        >
          <MimeIcon
            :content-type="file.httpMetadata.contentType"
            :thumbnail="file.customMetadata.thumbnail ? `/raw/_$flaredrive$/thumbnails/${file.customMetadata.thumbnail}.png` : null"
          />
          <div class="file-info">
            <span class="file-name" v-text="file.key.split('/').pop()"></span>
            <span class="file-meta">
              <span v-text="new Date(file.uploaded).toLocaleString()"></span>
              <span class="separator">•</span>
              <span v-text="formatSize(file.size)"></span>
            </span>
          </div>
          <button class="more-btn" @click.stop="showContextMenu = true; focusedItem = file;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </li>
    </ul>
    <div v-if="loading" style="margin-top: 12px; text-align: center">
      <span>加载中...</span>
    </div>
    <div
      v-else-if="!filteredFiles.length && !filteredFolders.length"
      style="margin-top: 12px; text-align: center"
    >
      <span>没有文件</span>
    </div>
    <Dialog v-model="showContextMenu">
      <div
        v-text="focusedItem.key || focusedItem"
        class="contextmenu-filename"
        @click.stop.prevent
      ></div>
      <ul v-if="typeof focusedItem === 'string'" class="contextmenu-list">
        <li>
          <button @click="copyLink(`/?p=${encodeURIComponent(focusedItem)}`)">
            <span>复制链接</span>
          </button>
        </li>
        <li>
          <button @click="moveFile(focusedItem + '_$folder$')">
            <span>移动</span>
          </button>
        </li>
        <li v-if="clipboard">
          <button @click="pasteHere">
            <span>粘贴</span>
          </button>
        </li>
        <li>
          <button
            style="color: red"
            @click="removeFile(focusedItem + '_$folder$')"
          >
            <span>删除</span>
          </button>
        </li>
      </ul>
      <ul v-else class="contextmenu-list">
        <li>
          <button @click="renameFile(focusedItem.key)">
            <span>重命名</span>
          </button>
        </li>
        <li>
          <a :href="`/raw/${focusedItem.key}`" target="_blank" download @click="showContextMenu = false">
            <span>下载</span>
          </a>
        </li>
        <li>
          <button @click="copyFile(focusedItem.key)">
            <span>复制</span>
          </button>
        </li>
        <li v-if="clipboard">
          <button @click="pasteHere">
            <span>粘贴</span>
          </button>
        </li>
        <li>
          <button @click="moveFile(focusedItem.key)">
            <span>移动</span>
          </button>
        </li>
        <li>
          <button @click="copyLink(`/raw/${focusedItem.key}`)">
            <span>复制链接</span>
          </button>
        </li>
        <li>
          <button style="color: red" @click="removeFile(focusedItem.key)">
            <span>删除</span>
          </button>
        </li>
      </ul>
    </Dialog>
  </div>
</template>

<script>
import {
  generateThumbnail,
  blobDigest,
  multipartUpload,
  SIZE_LIMIT,
} from "/assets/main.mjs";
import Dialog from "./Dialog.vue";
import Menu from "./Menu.vue";
import MimeIcon from "./MimeIcon.vue";
import UploadPopup from "./UploadPopup.vue";

export default {
  data: () => ({
    cwd: new URL(window.location).searchParams.get("p") || "",
    files: [],
    folders: [],
    clipboard: null,
    focusedItem: null,
    loading: false,
    order: null,
    search: "",
    showContextMenu: false,
    showMenu: false,
    showUploadPopup: false,
    uploadProgress: null,
    uploadQueue: [],
    authHeader: null,
  }),

  computed: {
    filteredFiles() {
      let files = this.files;
      if (this.search) {
        files = files.filter((file) =>
          file.key.split("/").pop().includes(this.search)
        );
      }
      return files;
    },

    filteredFolders() {
      let folders = this.folders;
      if (this.search) {
        folders = folders.filter((folder) => folder.includes(this.search));
      }
      return folders;
    },
  },

  methods: {
    copyLink(link) {
      const url = new URL(link, window.location.origin);
      navigator.clipboard.writeText(url.toString());
      this.showContextMenu = false;
      this.showMessage('链接已复制到剪贴板', 'success');
    },

    copyFile(key) {
      this.clipboard = key;
      this.showContextMenu = false;
      this.showMessage('文件已复制到剪贴板', 'success');
    },

    getAuthHeaders() {
      return this.authHeader ? { 'Authorization': this.authHeader } : {};
    },

    captureAuth(response) {
      if (!this.authHeader) {
        const auth = response.headers.get('Authorization');
        if (auth) {
          this.authHeader = auth;
          localStorage.setItem('auth_header', auth);
        }
      }
    },

    async authFetch(url, options = {}) {
      const headers = { ...this.getAuthHeaders(), ...options.headers };
      const response = await fetch(url, { 
        ...options, 
        headers,
        credentials: 'include'  // Ensure cookies/auth are included
      });
      this.captureAuth(response);
      return response;
    },

    async copyPaste(source, target) {
      const uploadUrl = `/api/write/items/${target}`;
      const res = await this.authFetch(uploadUrl, {
        method: 'PUT',
        body: '',
        headers: { "x-amz-copy-source": encodeURIComponent(source), "x-requested-with": "XMLHttpRequest" }
      });
      if (res.status === 401) {
        this.authHeader = null;
        window.location.href = '/api/write/';
      }
      if (!res.ok) throw new Error('Copy failed');
    },

    async createFolder() {
      try {
        const folderName = window.prompt("请输入文件夹名称");
        if (!folderName) return;
        this.showUploadPopup = false;
        const uploadUrl = `/api/write/items/${this.cwd}${folderName}/_$folder$`;
        const res = await this.authFetch(uploadUrl, {
          method: 'PUT',
          body: '',
          headers: { "x-requested-with": "XMLHttpRequest" }
        });
        if (res.status === 401) {
          this.authHeader = null;
          window.location.href = '/api/write/';
        }
        if (!res.ok) throw new Error('Create folder failed');
        this.fetchFiles();
      } catch (error) {
        console.log(`Create folder failed`);
      }
    },

    fetchFiles() {
      this.files = [];
      this.folders = [];
      this.loading = true;
      this.authFetch(`/api/children/${this.cwd}`)
        .then((res) => {
          if (res.status === 401) {
            this.authHeader = null;
            window.location.href = '/api/write/';
            return null;
          }
          if (!res.ok) throw new Error('Failed to fetch files');
          return res.json();
        })
        .then((files) => {
          if (!files) return;
          this.files = files.value;
          if (this.order) {
            this.files.sort((a, b) => {
              if (this.order === "size") {
                return b.size - a.size;
              }
              return a.key.localeCompare(b.key);
            });
          }
          this.folders = files.folders;
          this.loading = false;
        })
        .catch((error) => {
          console.error('Fetch files error:', error);
          this.loading = false;
        });
    },

    formatSize(size) {
      const units = ["B", "KB", "MB", "GB", "TB"];
      let i = 0;
      while (size >= 1024) {
        size /= 1024;
        i++;
      }
      return `${size.toFixed(1)} ${units[i]}`;
    },

    onDrop(ev) {
      let files;
      if (ev.dataTransfer.items) {
        files = [...ev.dataTransfer.items]
          .filter((item) => item.kind === "file")
          .map((item) => item.getAsFile());
      } else files = ev.dataTransfer.files;
      this.uploadFiles(files);
    },

    onMenuClick(text) {
      switch (text) {
        case "名称A-Z":
          this.order = null;
          break;
        case "大小↑":
          this.order = "大小↑";
          break;
        case "大小↓":
          this.order = "大小↓";
          break;
        case "粘贴":
          return this.pasteFile();
      }
      this.files.sort((a, b) => {
        if (this.order === "大小↑") {
          return a.size - b.size;
        } else if (this.order === "大小↓") {
          return b.size - a.size;
        } else {
          return a.key.localeCompare(b.key);
        }
      });
    },

    onUploadClicked(fileElement) {
      if (!fileElement.value) return;
      this.uploadFiles(fileElement.files);
      this.showUploadPopup = false;
      fileElement.value = null;
    },

    preview(filePath){
      window.open(filePath);
    },

    async pasteFile() {
      if (!this.clipboard) {
        this.showMessage('请先复制文件', 'warning');
        return;
      }
      let newName = window.prompt("Rename to:");
      if (newName === null) return;
      if (newName === "") newName = this.clipboard.split("/").pop();
      await this.copyPaste(this.clipboard, `${this.cwd}${newName}`);
      this.showContextMenu = false;
      this.showMessage('文件已粘贴', 'success');
      this.fetchFiles();
    },

    async pasteHere() {
      if (!this.clipboard) {
        this.showMessage('请先复制文件', 'warning');
        return;
      }
      let targetPath;
      if (typeof this.focusedItem === 'string') {
        // Folder - paste inside this folder
        targetPath = this.focusedItem;
      } else {
        // File - paste into parent directory
        const filePath = this.focusedItem.key;
        targetPath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
      }
      // Ensure targetPath ends with /
      if (!targetPath.endsWith('/')) targetPath += '/';
      // Get the filename from clipboard
      const fileName = this.clipboard.split('/').pop();
      await this.copyPaste(this.clipboard, `${targetPath}${fileName}`);
      this.showContextMenu = false;
      this.showMessage('文件已粘贴', 'success');
      this.fetchFiles();
    },

    async processUploadQueue() {
      if (!this.uploadQueue.length) {
        this.fetchFiles();
        this.uploadProgress = null;
        return;
      }

      /** @type File **/
      const { basedir, file } = this.uploadQueue.pop(0);
      let thumbnailDigest = null;

      if (file.type.startsWith("image/") || file.type === "video/mp4") {
        try {
          const thumbnailBlob = await generateThumbnail(file);
          const digestHex = await blobDigest(thumbnailBlob);

          const thumbnailUploadUrl = `/api/write/items/_$flaredrive$/thumbnails/${digestHex}.png`;
          try {
            const res = await this.authFetch(thumbnailUploadUrl, {
              method: 'PUT',
              body: thumbnailBlob,
              headers: { 'Content-Type': 'image/png', 'x-requested-with': 'XMLHttpRequest' }
            });
            if (res.status === 401) {
              this.authHeader = null;
              window.location.href = '/api/write/';
              return;
            }
            if (!res.ok) throw new Error('Upload failed');
            thumbnailDigest = digestHex;
          } catch (error) {
            console.log(`Upload ${digestHex}.png failed`);
          }
        } catch (error) {
          console.log(`Generate thumbnail failed`);
        }
      }

      try {
        const uploadUrl = `/api/write/items/${basedir}${file.name}`;
        const headers = { ...this.getAuthHeaders(), 'x-requested-with': 'XMLHttpRequest' };
        if (thumbnailDigest) headers["fd-thumbnail"] = thumbnailDigest;
        headers['Content-Type'] = file.type;
        
        if (file.size >= SIZE_LIMIT) {
          await this.multipartUpload(`${basedir}${file.name}`, file, {
            headers,
            onUploadProgress: (progress) => {
              this.uploadProgress = (progress.loaded / progress.total) * 100;
            },
          });
        } else {
          const res = await this.authFetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers
          });
          if (res.status === 401) {
            this.authHeader = null;
            window.location.href = '/api/write/';
            return;
          }
          if (!res.ok) throw new Error('Upload failed');
        }
      } catch (error) {
        console.log(`Upload ${file.name} failed`, error);
      }
      setTimeout(this.processUploadQueue);
    },

    async removeFile(key) {
      const displayName = key.endsWith('_$folder$')
        ? `文件夹 "${key.slice(0, -9)}"`
        : `文件 "${key}"`;

      const confirmMessage = key.endsWith('_$folder$')
        ? `确定要删除 ${displayName} 吗？\n⚠️ 这将递归删除文件夹中的所有文件和子文件夹，此操作不可恢复！`
        : `确定要删除 ${displayName} 吗？`;

      if (!window.confirm(confirmMessage)) return;

      try {
        if (key.endsWith('_$folder$')) {
          this.loading = true;
          console.log('正在删除文件夹及其所有内容...');
        }

        const response = await this.authFetch(`/api/write/items/${key}`, {
          method: 'DELETE',
          headers: { 'x-requested-with': 'XMLHttpRequest' }
        });
        if (response.status === 204 || response.ok) {
          const successMessage = key.endsWith('_$folder$')
            ? '文件夹及其所有内容删除成功'
            : '删除成功';
          console.log(successMessage);
          this.showMessage(successMessage, 'success');
          this.showContextMenu = false;
          this.fetchFiles();
        } else if (response.status === 401) {
          this.authHeader = null;
          window.location.href = '/api/write/';
        } else {
          console.log('删除完成，状态码:', response.status);
          this.fetchFiles();
        }
      } catch (error) {
        console.error('删除失败:', error);
        const errorMessage = key.endsWith('_$folder$')
          ? '文件夹删除失败，可能包含大量文件或网络问题'
          : '删除失败，请检查权限或网络连接';
        alert(errorMessage);
      } finally {
        this.loading = false;
      }
    },

    async renameFile(key) {
      const newName = window.prompt("重命名为:");
      if (!newName) return;
      await this.copyPaste(key, `${this.cwd}${newName}`);
      await this.authFetch(`/api/write/items/${key}`, { method: 'DELETE', headers: { 'x-requested-with': 'XMLHttpRequest' } });
      this.showContextMenu = false;
      this.fetchFiles();
    },

    async moveFile(key) {
      // 获取当前的目录结构
      const currentPath = this.cwd; // 当前所在目录
      const allFolders = [...this.folders]; // 所有可用目录
      
      // 如果不在根目录，添加返回上级目录选项
      if (currentPath !== '') {
        const parentPath = currentPath.replace(/[^\/]+\/$/, '');
        if (!allFolders.includes(parentPath) && parentPath !== '') {
          allFolders.unshift(parentPath);
        }
      }
      
      // 添加根目录选项
      if (!allFolders.includes('')) {
        allFolders.unshift('');
      }
      
      // 构建选择列表
      const folderOptions = allFolders.map(folder => {
        const displayName = folder === '' ? '根目录' : 
                          folder === currentPath ? '当前目录' :
                          folder.replace(/.*\/(?!$)|\//g, '') + '/';
        return {
          display: displayName,
          value: folder
        };
      });
      
      // 创建选择提示
      const options = folderOptions.map((opt, index) => 
        `${index + 1}. ${opt.display}`
      ).join('\n');
      
      const promptText = `请选择目标目录(输入数字):\n${options}\n`;
      const selection = window.prompt(promptText);
      
      if (!selection) return;
      
      const selectedIndex = parseInt(selection) - 1;
      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= folderOptions.length) {
        alert('无效的选择');
        return;
      }
      
      const targetPath = folderOptions[selectedIndex].value;
      
      // 获取文件名
      const fileName = key.split('/').pop();
      // 如果是文件夹,需要移除_$folder$后缀
      const finalFileName = fileName.endsWith('_$folder$') ? fileName.slice(0, -9) : fileName;
      
      // 修复：正确处理目标路径，避免双斜杠
      const normalizedPath = targetPath === '' ? '' : (targetPath.endsWith('/') ? targetPath : targetPath + '/');
      
      try {
        // 如果是目录（以_$folder$结尾），则需要移动整个目录内容
        if (key.endsWith('_$folder$')) {
          // 获取源目录的基础路径（移除_$folder$后缀）
          const sourceBasePath = key.slice(0, -9);
          // 获取目标目录的基础路径，修复根目录的情况
          const targetBasePath = normalizedPath + finalFileName + '/';
          
          // 递归获取所有子文件和子目录
          const allItems = await this.getAllItems(sourceBasePath);
          
          // 显示进度提示
          const totalItems = allItems.length;
          let processedItems = 0;
          
          // 移动所有项目
          for (const item of allItems) {
            const relativePath = item.key.substring(sourceBasePath.length);
            const newPath = targetBasePath + relativePath;
            
            try {
              // 复制到新位置
              await this.copyPaste(item.key, newPath);
              // 删除原位置
              await this.authFetch(`/api/write/items/${item.key}`, { method: 'DELETE', headers: { 'x-requested-with': 'XMLHttpRequest' } });
              
              // 更新进度
              processedItems++;
              this.uploadProgress = (processedItems / totalItems) * 100;
            } catch (error) {
              console.error(`移动 ${item.key} 失败:`, error);
            }
          }
          
          // 移动目录标记
          const targetFolderPath = targetBasePath.slice(0, -1) + '_$folder$';
          await this.copyPaste(key, targetFolderPath);
          await this.authFetch(`/api/write/items/${key}`, { method: 'DELETE', headers: { 'x-requested-with': 'XMLHttpRequest' } });
          
          // 清除进度
          this.uploadProgress = null;
        } else {
          // 单文件移动逻辑，修复根目录的情况
          const targetFilePath = normalizedPath + finalFileName;
          await this.copyPaste(key, targetFilePath);
          await this.authFetch(`/api/write/items/${key}`, { method: 'DELETE', headers: { 'x-requested-with': 'XMLHttpRequest' } });
        }
        
        // 刷新文件列表
        this.fetchFiles();
        this.showContextMenu = false;
      } catch (error) {
        console.error('移动失败:', error);
        alert('移动失败,请检查目标路径是否正确');
      }
    },

    // 新增：递归获取目录下所有文件和子目录
    async getAllItems(prefix) {
      const items = [];
      let marker = null;
      
      do {
        const url = new URL(`/api/children/${prefix}`, window.location.origin);
        if (marker) {
          url.searchParams.set('marker', marker);
        }
        
        const response = await this.authFetch(url);
        if (response.status === 401) {
          this.authHeader = null;
          window.location.href = '/api/write/';
          return items;
        }
        const data = await response.json();
        
        // 添加文件
        items.push(...data.value);
        
        // 处理子目录
        for (const folder of data.folders) {
          // 添加目录标记
          items.push({
            key: folder + '_$folder$',
            size: 0,
            uploaded: new Date().toISOString(),
          });
          
          // 递归获取子目录内容
          const subItems = await this.getAllItems(folder);
          items.push(...subItems);
        }
        
        marker = data.marker;
      } while (marker);
      
      return items;
    },

    uploadFiles(files) {
      if (this.cwd && !this.cwd.endsWith("/")) this.cwd += "/";

      const uploadTasks = Array.from(files).map((file) => ({
        basedir: this.cwd,
        file,
      }));
      this.uploadQueue.push(...uploadTasks);
      setTimeout(() => this.processUploadQueue());
    },

    showMessage(message, type = 'info') {
      const messageEl = document.createElement('div');
      messageEl.className = `message-toast message-${type}`;
      messageEl.textContent = message;
      document.body.appendChild(messageEl);
      setTimeout(() => {
        messageEl.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => {
          if (messageEl.parentNode) {
            document.body.removeChild(messageEl);
          }
        }, 300);
      }, 3000);
    },

    async multipartUpload(key, file, options) {
      const headers = { ...options?.headers, 'x-requested-with': 'XMLHttpRequest' };
      headers["content-type"] = file.type;

      const uploadIdRes = await this.authFetch(`/api/write/items/${key}?uploads`, {
        method: 'POST',
        body: '',
        headers
      });
      const { uploadId } = await uploadIdRes.json();

      const totalChunks = Math.ceil(file.size / 100 / 1000 / 1000);
      const uploadedParts = [];

      for (let i = 1; i <= totalChunks; i++) {
        const chunk = file.slice((i - 1) * 100 * 1000 * 1000, i * 100 * 1000 * 1000);
        const searchParams = new URLSearchParams({ partNumber: i, uploadId });

        const partRes = await this.authFetch(`/api/write/items/${key}?${searchParams}`, {
          method: 'PUT',
          body: chunk,
          headers: { 'Content-Type': file.type, 'x-requested-with': 'XMLHttpRequest' }
        });

        const etag = partRes.headers.get('etag') || `"${i}"`;
        uploadedParts[i - 1] = { partNumber: i, etag };

        if (typeof options?.onUploadProgress === "function") {
          options.onUploadProgress({
            loaded: Math.min(i * 100 * 1000 * 1000, file.size),
            total: file.size,
          });
        }
      }

      const completeParams = new URLSearchParams({ uploadId });
      await this.authFetch(`/api/write/items/${key}?${completeParams}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
        body: JSON.stringify({ parts: uploadedParts })
      });
    },
  },

  watch: {
    cwd: {
      handler() {
        this.fetchFiles();
        const url = new URL(window.location);
        if ((url.searchParams.get("p") || "") !== this.cwd) {
          this.cwd
            ? url.searchParams.set("p", this.cwd)
            : url.searchParams.delete("p");
          window.history.pushState(null, "", url.toString());
        }
        document.title = `${
          this.cwd.replace(/.*\/(?!$)|\//g, "") || "/"
        } - 文件库`;
      },
      immediate: true,
    },
  },

  created() {
    // Load authHeader from localStorage if available
    const storedAuth = localStorage.getItem('auth_header');
    if (storedAuth) {
      this.authHeader = storedAuth;
    }
    
    window.addEventListener("popstate", (ev) => {
      const searchParams = new URL(window.location).searchParams;
      if (searchParams.get("p") !== this.cwd)
        this.cwd = searchParams.get("p") || "";
    });
  },

  components: {
    Dialog,
    Menu,
    MimeIcon,
    UploadPopup,
  },
};
</script>

<style>
.main {
  height: 100%;
}

.app-bar {
  position: sticky;
  top: var(--space-sm);
  margin: var(--space-sm) var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  display: flex;
  gap: var(--space-md);
  z-index: 100;
}

.menu-button {
  display: flex;
  position: relative;
  margin-left: var(--space-xs);
}

.menu-button > button {
  transition: all var(--transition-base);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.menu-button > button:hover {
  background-color: var(--bg-hover);
}

.menu {
  position: absolute;
  top: calc(100% + var(--space-sm));
  right: 0;
}
</style>
