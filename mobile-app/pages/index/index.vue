<template>
	<view class="container">
		<view class="hero-section">
			<view class="logo-box">
				<text class="logo-icon">🗑️</text>
			</view>
			<text class="hero-title">OpenJunk</text>
			<text class="hero-subtitle">全球最真实的学术垃圾场</text>
		</view>

		<view class="mission-card">
			<view class="card-header">
				<text class="card-icon">🎯</text>
				<text class="card-title">我们的使命</text>
			</view>
			<text class="card-content">
				致力于收录全球各类“底刊”与“学术垃圾”，为那些无处安放的思想提供最后的归宿。在这里，我们不粉饰太平，直面学术生涯中的废品。
			</text>
		</view>

		<view class="features-grid">
			<view class="feature-item">
				<view class="feature-icon bg-red">⚠️</view>
				<text class="feature-title">诚实面对</text>
				<text class="feature-desc">如果是垃圾，就称之为垃圾。</text>
			</view>
			<view class="feature-item">
				<view class="feature-icon bg-green">♻️</view>
				<text class="feature-title">变废为宝</text>
				<text class="feature-desc">也许有人能在垃圾堆里翻到金子。</text>
			</view>
			<view class="feature-item">
				<view class="feature-icon bg-blue">💨</view>
				<text class="feature-title">自由呼吸</text>
				<text class="feature-desc">没有拒稿烦恼，享受学术废气。</text>
			</view>
		</view>

		<view class="story-section">
			<text class="section-title">我们的故事</text>
			<text class="story-text">
				OpenJunk 成立于 2026 年的一个深夜，当时我们的创始人面对着第 108 次被拒稿的邮件，陷入了深深的沉思...
			</text>
			<text class="story-text">
				于是，一个大胆的想法诞生了：建立一个专门收录“被遗弃论文”的平台。我们不追求影响因子，我们追求“垃圾因子”。
			</text>
		</view>

		<view class="footer">
			<text class="footer-text">© 2026 OpenJunk. All Wrongs Reserved.</text>
		</view>
	</view>
</template>

<script setup>
	// Simple static page
</script>

<style lang="scss">
	.container {
		padding: 40rpx;
		background-color: #f8f9fa;
		min-height: 100vh;
	}

	.hero-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 60rpx 0 80rpx;
	}

	.logo-box {
		width: 160rpx;
		height: 160rpx;
		background: #fff;
		border-radius: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.05);
		margin-bottom: 30rpx;
	}

	.logo-icon {
		font-size: 80rpx;
	}

	.hero-title {
		font-size: 56rpx;
		font-weight: 900;
		color: #333;
		margin-bottom: 16rpx;
	}

	.hero-subtitle {
		font-size: 32rpx;
		color: #666;
		font-weight: 300;
	}

	.mission-card {
		background: #fff;
		padding: 40rpx;
		border-radius: 24rpx;
		box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.03);
		margin-bottom: 40rpx;
	}

	.card-header {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;
	}

	.card-icon {
		font-size: 40rpx;
		margin-right: 20rpx;
	}

	.card-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}

	.card-content {
		font-size: 28rpx;
		color: #555;
		line-height: 1.6;
	}

	.features-grid {
		display: flex;
		justify-content: space-between;
		margin-bottom: 50rpx;
	}

	.feature-item {
		width: 30%;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.feature-icon {
		width: 100rpx;
		height: 100rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		margin-bottom: 20rpx;
	}

	.bg-red { background: #ffebee; color: #d32f2f; }
	.bg-green { background: #e8f5e9; color: #388e3c; }
	.bg-blue { background: #e3f2fd; color: #1976d2; }

	.feature-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
	}

	.feature-desc {
		font-size: 22rpx;
		color: #999;
		line-height: 1.4;
	}

	.story-section {
		margin-bottom: 60rpx;
	}

	.section-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 30rpx;
		display: block;
		text-align: center;
	}

	.story-text {
		font-size: 28rpx;
		color: #666;
		line-height: 1.8;
		margin-bottom: 20rpx;
		display: block;
		text-indent: 2em;
	}

	.footer {
		text-align: center;
		padding-bottom: 40rpx;
	}

	.footer-text {
		font-size: 24rpx;
		color: #ccc;
	}
</style>