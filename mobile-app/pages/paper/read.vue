<template>
	<view class="container">
		<web-view :src="viewerUrl"></web-view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { BASE_URL } from '@/common/config.js';

	const viewerUrl = ref('');

	onLoad((options) => {
		if (options.url) {
			const pdfUrl = decodeURIComponent(options.url);
			// Construct full URL to the viewer on the Next.js server
			// Viewer is at /pdfjs/index.html
			// Pass pdfUrl as 'file' parameter
			
			// Ensure we use the public server address if BASE_URL is set to it
			// The viewer.html is static in public folder, so it's accessible at BASE_URL/pdfjs/index.html
			
			viewerUrl.value = `${BASE_URL}/pdfjs/index.html?file=${encodeURIComponent(pdfUrl)}`;
			console.log('PDF Viewer URL:', viewerUrl.value);
		}
	});
</script>

<style>
	.container {
		width: 100%;
		height: 100vh;
	}
</style>