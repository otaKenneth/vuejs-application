import axios from 'axios'
import * as constants from './constants'

axios.defaults.baseURL = constants.API_URL
axios.defaults.headers.post['Content-Type'] = 'application/json'
const axiosInstance = axios.create()

export default axiosInstance