import { theme } from 'antd'

const themeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#3d9eff',
    colorInfo: '#3d9eff',
    colorBgBase: '#06101c',
    colorBgContainer: '#0c1b2e',
    colorBgElevated: '#10233c',
    colorBorder: '#1e3f66',
    colorText: '#d7e7ff',
    borderRadius: 10,
    fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  },
  components: {
    Button: {
      controlHeightLG: 48,
      fontWeight: 600,
    },
    Modal: {
      contentBg: '#0c1b2e',
      headerBg: '#0c1b2e',
      titleColor: '#e8f3ff',
    },
    Input: {
      activeBorderColor: '#3d9eff',
    },
    Select: {
      optionSelectedBg: '#16345a',
    },
  },
}

export default themeConfig
