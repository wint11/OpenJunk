
<script setup>
	import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

	onLaunch(() => {
		console.log('App Launch')
	})
	onShow(() => {
		console.log('App Show')
	})
	onHide(() => {
		console.log('App Hide')
	})
</script>

<style lang="scss">
	/* 每个页面公共css */
	@import './uni.scss';
	
	page {
		background-color: #f5f7fa;
		font-size: 28rpx;
		color: #303133;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
	}
	
	.container {
		padding: 24rpx;
	}
	
	.card {
		background-color: #ffffff;
		border-radius: 16rpx;
		padding: 30rpx;
		margin-bottom: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
	}
	
	.card:active {
		transform: scale(0.98);
	}
</style>
