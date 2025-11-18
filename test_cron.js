// 测试Cloudflare Workers定时任务功能
// 使用方法：node test_cron.js

const BASE_URL = 'https://your-domain.workers.dev'; // 替换为你的实际域名
const JWT_SECRET = 'your-jwt-secret-here'; // 替换为你的实际JWT密钥

async function testCronJob() {
  console.log('🚀 开始测试定时任务功能...');
  
  try {
    // 测试定时任务API
    console.log('📊 调用定时任务API...');
    const response = await fetch(`${BASE_URL}/api/system/cron/update-stats`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_SECRET}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ 定时任务执行成功:');
      console.log(`   - 离线节点更新数量: ${result.offline_nodes_updated}`);
      console.log(`   - 总节点数: ${result.current_stats.total_nodes}`);
      console.log(`   - 在线节点数: ${result.current_stats.online_nodes}`);
      console.log(`   - 总连接数: ${result.current_stats.connections}`);
      console.log(`   - 总带宽: ${result.current_stats.bandwidth} Mbps`);
      console.log(`   - 总阶梯带宽: ${result.current_stats.tierband} Mbps`);
      console.log(`   - 历史数据已更新: ${result.history_updated}`);
    } else {
      console.error('❌ 定时任务执行失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('错误详情:', errorText);
    }

    // 测试获取统计数据API
    console.log('\n📈 获取统计数据...');
    const statsResponse = await fetch(`${BASE_URL}/api/stats`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ 统计数据获取成功:');
      console.log(`   - 总节点数: ${statsData.total_nodes}`);
      console.log(`   - 在线节点数: ${statsData.online_nodes}`);
      console.log(`   - 总连接数: ${statsData.connection_count_total}`);
      console.log(`   - 最大连接数: ${statsData.max_connections_total}`);
      console.log(`   - 当前总带宽: ${statsData.current_bandwidth_total} Mbps`);
      console.log(`   - 最大总带宽: ${statsData.max_bandwidth_total} Mbps`);
      
      if (statsData.history) {
        console.log(`   - 在线节点历史数据点数: ${statsData.history.online_nodes?.length || 0}`);
        console.log(`   - 连接数历史数据点数: ${statsData.history.connections?.length || 0}`);
        console.log(`   - 带宽历史数据点数: ${statsData.history.bandwidth?.length || 0}`);
        console.log(`   - 阶梯带宽历史数据点数: ${statsData.history.tierband?.length || 0}`);
      }
    } else {
      console.error('❌ 获取统计数据失败:', statsResponse.status, statsResponse.statusText);
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testCronJob().then(() => {
  console.log('\n🎉 测试完成！');
}).catch(error => {
  console.error('💥 测试失败:', error);
});