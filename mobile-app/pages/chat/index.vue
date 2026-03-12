<template>
	<view class="container">
		<!-- Login Guard -->
		<view v-if="!isLoggedIn" class="login-required">
			<text class="icon">🔒</text>
			<text class="title">管理员专区</text>
			<text class="desc">请先登录管理员账号以访问群聊功能。</text>
			<button class="btn-primary" @click="goToLogin">去登录</button>
		</view>

		<!-- Chat Interface -->
		<view v-else class="chat-container">
			<scroll-view 
				class="message-list" 
				scroll-y 
				:scroll-top="scrollTop" 
				scroll-with-animation
			>
				<view class="loading-more" v-if="loading">
					<text>加载中...</text>
				</view>

				<view 
					v-for="(msg, index) in messages" 
					:key="msg.id" 
					class="message-item"
					:class="{ 'self': msg.senderId === user.id }"
				>
					<view class="avatar">
						<text>{{ getAvatarText(msg.sender.name) }}</text>
					</view>
					<view class="content-wrapper">
						<view class="sender-info">
							<text class="name">{{ msg.sender.name || 'Unknown' }}</text>
							<view class="role-badge">
								<text>{{ getRoleLabel(msg.sender.role) }}</text>
							</view>
						</view>
						<view class="bubble">
							<text>{{ msg.content }}</text>
						</view>
						<text class="time">{{ formatTime(msg.createdAt) }}</text>
					</view>
				</view>
			</scroll-view>

			<view class="input-area">
				<input 
					class="input" 
					v-model="inputContent" 
					placeholder="发送消息..." 
					confirm-type="send"
					@confirm="sendMessage"
				/>
				<button 
					class="send-btn" 
					:disabled="!inputContent.trim() || sending" 
					@click="sendMessage"
				>
					发送
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref, onMounted, onUnmounted, nextTick } from 'vue'
	import { onShow } from '@dcloudio/uni-app'
	import { API } from '@/common/config.js'

	const isLoggedIn = ref(false)
	const user = ref({})
	const messages = ref([])
	const inputContent = ref('')
	const loading = ref(false)
	const sending = ref(false)
	const scrollTop = ref(0)
	let pollInterval = null

	onShow(() => {
		checkLogin()
	})

	onUnmounted(() => {
		if (pollInterval) clearInterval(pollInterval)
	})

	const checkLogin = () => {
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo && userInfo.id) {
			user.value = userInfo
			isLoggedIn.value = true
			loadMessages()
			// Start polling
			if (!pollInterval) {
				pollInterval = setInterval(loadMessages, 5000)
			}
		} else {
			isLoggedIn.value = false
			if (pollInterval) {
				clearInterval(pollInterval)
				pollInterval = null
			}
		}
	}

	const goToLogin = () => {
		uni.switchTab({
			url: '/pages/profile/index'
		})
	}

	const loadMessages = () => {
		// Silent load usually, unless initial
		if (messages.value.length === 0) loading.value = true
		
		uni.request({
			url: `${API.CHAT}?userId=${user.value.id}`,
			method: 'GET',
			success: (res) => {
				if (res.statusCode === 200) {
					const newMessages = res.data
					// Check if we need to scroll down (if new messages arrived)
					const shouldScroll = messages.value.length !== newMessages.length
					
					messages.value = newMessages
					
					if (shouldScroll) {
						scrollToBottom()
					}
				} else if (res.statusCode === 403) {
					uni.showToast({ title: '无权访问', icon: 'none' })
				}
			},
			complete: () => {
				loading.value = false
			}
		})
	}

	const sendMessage = () => {
		if (!inputContent.value.trim() || sending.value) return

		const content = inputContent.value
		sending.value = true
		
		uni.request({
			url: API.CHAT,
			method: 'POST',
			data: {
				userId: user.value.id,
				content: content
			},
			success: (res) => {
				if (res.statusCode === 200) {
					inputContent.value = ''
					loadMessages() // Refresh immediately
				} else {
					uni.showToast({ title: '发送失败', icon: 'none' })
				}
			},
			fail: () => {
				uni.showToast({ title: '网络错误', icon: 'none' })
			},
			complete: () => {
				sending.value = false
			}
		})
	}

	const scrollToBottom = () => {
		nextTick(() => {
			scrollTop.value = 9999999
		})
	}

	const getAvatarText = (name) => {
		return name ? name[0].toUpperCase() : 'U'
	}

	const getRoleLabel = (role) => {
		const map = {
			'SUPER_ADMIN': '总编',
			'ADMIN': '管理员',
			'REVIEWER': '审稿人'
		}
		return map[role] || role
	}

	const formatTime = (dateStr) => {
		const date = new Date(dateStr)
		return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
	}
</script>

<style lang="scss">
	.container {
		height: 100vh;
		background-color: #f5f7fa;
		display: flex;
		flex-direction: column;
	}

	.login-required {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx;
	}

	.icon {
		font-size: 80rpx;
		margin-bottom: 30rpx;
	}

	.title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 20rpx;
	}

	.desc {
		font-size: 28rpx;
		color: #999;
		text-align: center;
		margin-bottom: 60rpx;
	}

	.btn-primary {
		background-color: #2979ff;
		color: #fff;
		padding: 0 60rpx;
		border-radius: 100rpx;
		font-size: 30rpx;
	}

	.chat-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.message-list {
		flex: 1;
		padding: 30rpx;
		box-sizing: border-box;
		height: 0; // Important for flex scroll
	}

	.loading-more {
		text-align: center;
		padding: 20rpx;
		color: #ccc;
		font-size: 24rpx;
	}

	.message-item {
		display: flex;
		margin-bottom: 40rpx;
		
		&.self {
			flex-direction: row-reverse;
			
			.content-wrapper {
				align-items: flex-end;
				margin-right: 20rpx;
				margin-left: 0;
			}
			
			.sender-info {
				flex-direction: row-reverse;
			}
			
			.bubble {
				background: #2979ff;
				color: #fff;
				border-radius: 20rpx 4rpx 20rpx 20rpx;
			}

			.name {
				display: none; // Hide own name
			}
		}
	}

	.avatar {
		width: 80rpx;
		height: 80rpx;
		background: #e0e0e0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		color: #666;
		font-weight: bold;
		flex-shrink: 0;
	}

	.content-wrapper {
		flex: 1;
		margin-left: 20rpx;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		max-width: 70%;
	}

	.sender-info {
		display: flex;
		align-items: center;
		margin-bottom: 8rpx;
		gap: 10rpx;
	}

	.name {
		font-size: 24rpx;
		color: #999;
	}

	.role-badge {
		background: #e3f2fd;
		padding: 2rpx 8rpx;
		border-radius: 6rpx;
		
		text {
			font-size: 20rpx;
			color: #2979ff;
		}
	}

	.bubble {
		background: #fff;
		padding: 20rpx;
		border-radius: 4rpx 20rpx 20rpx 20rpx;
		font-size: 30rpx;
		color: #333;
		line-height: 1.5;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
		word-break: break-all;
	}

	.time {
		font-size: 20rpx;
		color: #ccc;
		margin-top: 8rpx;
	}

	.input-area {
		background: #fff;
		padding: 20rpx;
		display: flex;
		align-items: center;
		border-top: 1rpx solid #eee;
		padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
	}

	.input {
		flex: 1;
		background: #f5f7fa;
		height: 80rpx;
		border-radius: 40rpx;
		padding: 0 30rpx;
		font-size: 30rpx;
		margin-right: 20rpx;
	}

	.send-btn {
		background: #2979ff;
		color: #fff;
		height: 80rpx;
		line-height: 80rpx;
		border-radius: 40rpx;
		padding: 0 40rpx;
		font-size: 28rpx;
		
		&[disabled] {
			background: #ccc;
			color: #fff;
		}
	}
</style>