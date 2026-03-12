<template>
	<view class="container">
		<!-- Login Form -->
		<view v-if="!isLoggedIn" class="login-box">
			<view class="header">
				<text class="title">欢迎回来</text>
				<text class="subtitle">登录以访问更多功能</text>
			</view>
			
			<view class="form">
				<view class="input-group">
					<text class="label">邮箱</text>
					<input class="input" type="text" v-model="email" placeholder="请输入邮箱" />
				</view>
				<view class="input-group">
					<text class="label">密码</text>
					<input class="input" type="password" password v-model="password" placeholder="请输入密码" />
				</view>
				
				<button class="btn-primary" @click="handleLogin" :loading="isLoading">登录</button>
			</view>
		</view>

		<!-- User Profile -->
		<view v-else class="profile-box">
			<view class="user-header">
				<view class="avatar">
					<text class="avatar-text">{{ user.name ? user.name[0].toUpperCase() : 'U' }}</text>
				</view>
				<view class="user-info">
					<text class="username">{{ user.name || 'User' }}</text>
					<text class="email">{{ user.email }}</text>
					<view class="role-badge" v-if="user.role">
						<text class="role-text">{{ user.role }}</text>
					</view>
				</view>
			</view>

			<view class="menu-list">
				<view class="menu-item" v-if="isAdmin" @click="openAdminDashboard">
					<text class="menu-text">管理后台 (Admin Dashboard)</text>
					<text class="arrow">></text>
				</view>
				
				<view class="menu-item">
					<text class="menu-text">我的收藏</text>
					<text class="arrow">></text>
				</view>
				
				<view class="menu-item">
					<text class="menu-text">浏览历史</text>
					<text class="arrow">></text>
				</view>
			</view>

			<button class="btn-logout" @click="handleLogout">退出登录</button>
		</view>
	</view>
</template>

<script setup>
	import { ref, computed, onMounted } from 'vue'
	import { API, BASE_URL } from '@/common/config.js'

	const isLoggedIn = ref(false)
	const isLoading = ref(false)
	const user = ref({})
	const email = ref('')
	const password = ref('')

	const isAdmin = computed(() => {
		return user.value && (user.value.role === 'ADMIN' || user.value.role === 'SUPER_ADMIN')
	})

	onMounted(() => {
		checkLoginStatus()
	})

	const checkLoginStatus = () => {
		const savedUser = uni.getStorageSync('userInfo')
		if (savedUser) {
			user.value = savedUser
			isLoggedIn.value = true
		}
	}

	const handleLogin = () => {
		if (!email.value || !password.value) {
			uni.showToast({
				title: '请输入邮箱和密码',
				icon: 'none'
			})
			return
		}

		isLoading.value = true
		
		uni.request({
			url: API.LOGIN,
			method: 'POST',
			data: {
				email: email.value,
				password: password.value
			},
			success: (res) => {
				if (res.statusCode === 200 && res.data.user) {
					user.value = res.data.user
					isLoggedIn.value = true
					uni.setStorageSync('userInfo', res.data.user)
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
				} else {
					uni.showToast({
						title: res.data.error || '登录失败',
						icon: 'none'
					})
				}
			},
			fail: () => {
				uni.showToast({
					title: '网络请求失败',
					icon: 'none'
				})
			},
			complete: () => {
				isLoading.value = false
			}
		})
	}

	const handleLogout = () => {
		uni.removeStorageSync('userInfo')
		user.value = {}
		isLoggedIn.value = false
		email.value = ''
		password.value = ''
		uni.showToast({
			title: '已退出',
			icon: 'none'
		})
	}

	const openAdminDashboard = () => {
		// Use external browser or WebView to access the admin panel
		// Using BASE_URL/admin
		const adminUrl = `${BASE_URL}/admin`
		
		// Method 1: Open in external browser (Recommended for complex admin panels)
		// plus.runtime.openURL(adminUrl) // Works in App
		
		// Method 2: Navigate to a WebView page (Need to create one)
		// For now, show a modal with the link
		uni.showModal({
			title: '访问后台',
			content: '移动端管理功能正在开发中，是否跳转到网页版后台？',
			success: (res) => {
				if (res.confirm) {
					// H5 logic
					// window.location.href = adminUrl
					
					// App logic (if creating an app)
					// plus.runtime.openURL(adminUrl)
					
					// Since this is likely H5 or App, let's try a safe approach
					// Or simpler: copy to clipboard
					uni.setClipboardData({
						data: adminUrl,
						success: () => {
							uni.showToast({ title: '链接已复制，请在浏览器打开' })
						}
					})
				}
			}
		})
	}
</script>

<style lang="scss">
	.container {
		padding: 40rpx;
		min-height: 100vh;
		background-color: #f5f7fa;
	}

	.login-box {
		margin-top: 100rpx;
	}

	.header {
		margin-bottom: 60rpx;
	}

	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 16rpx;
	}

	.subtitle {
		font-size: 28rpx;
		color: #999;
	}

	.form {
		background: #fff;
		padding: 40rpx;
		border-radius: 20rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.05);
	}

	.input-group {
		margin-bottom: 30rpx;
	}

	.label {
		font-size: 28rpx;
		color: #666;
		margin-bottom: 12rpx;
		display: block;
	}

	.input {
		height: 88rpx;
		background: #f8f8f8;
		border-radius: 12rpx;
		padding: 0 24rpx;
		font-size: 30rpx;
	}

	.btn-primary {
		background-color: #2979ff;
		color: #fff;
		border-radius: 44rpx;
		margin-top: 40rpx;
		font-size: 32rpx;
		font-weight: 500;
	}

	.profile-box {
		
	}

	.user-header {
		background: #fff;
		padding: 40rpx;
		border-radius: 20rpx;
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
	}

	.avatar {
		width: 100rpx;
		height: 100rpx;
		background: #e0e0e0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 30rpx;
	}

	.avatar-text {
		font-size: 40rpx;
		color: #666;
		font-weight: bold;
	}

	.user-info {
		flex: 1;
	}

	.username {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 8rpx;
	}

	.email {
		font-size: 26rpx;
		color: #999;
		display: block;
		margin-bottom: 12rpx;
	}

	.role-badge {
		background: #e3f2fd;
		padding: 4rpx 16rpx;
		border-radius: 8rpx;
		display: inline-block;
	}

	.role-text {
		color: #2979ff;
		font-size: 22rpx;
	}

	.menu-list {
		background: #fff;
		border-radius: 20rpx;
		margin-bottom: 40rpx;
	}

	.menu-item {
		padding: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-text {
		font-size: 30rpx;
		color: #333;
	}

	.arrow {
		color: #ccc;
	}

	.btn-logout {
		background: #fff;
		color: #ff3b30;
		font-size: 30rpx;
		border-radius: 20rpx;
	}
</style>