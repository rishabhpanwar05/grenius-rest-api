'use strict'

module.exports={
	name: 'GREnius',
	version: '0.0.1',
	env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    base_url: process.env.BASE_URL || 'http://localhost:3001',
    db: {
        uri: 'mongodb://127.0.0.1:27017/greniusTest',
    },
	MY_SECRET:"thisismysecretcodekjkbku2441gvbjnjsnf1412321jnwjenvajdbgdh2fjwbghbfkj62ngiu",
    MY_GOOGLE_API_KEY:"AIzaSyDlDHuANynM95U0K2IKnsqF3o7pTFrzP3A"
}