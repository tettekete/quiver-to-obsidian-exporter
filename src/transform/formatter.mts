import dayjs from "dayjs";


export const formatTime = (timestamp: number) => {

  return dayjs(timestamp)
    .format('YYYY-MM-DD(ddd) HH:mm:ss')
}
