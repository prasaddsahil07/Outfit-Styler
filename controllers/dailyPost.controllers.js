import axios from 'axios';

const options = {
  method: 'GET',
  url: 'https://instagram130.p.rapidapi.com/post',
  params: { post_url: 'https://www.instagram.com/p/CxT6NmsKxyz/' },
  headers: {
		'x-rapidapi-key': '1b7a6d6cacmsh018e9ac5ec06393p1a3433jsn5152b0fd5b5e',
		'x-rapidapi-host': 'instagram120.p.rapidapi.com'
	}
};

export const dailyPostFromInstagram = async (req, res) => {
  try {
    const { data } = await axios.request(options);
    res.json(data);
  } catch (error) {
    console.error('❌ Instagram API Error:', error.message);
    res.status(500).json({ message: 'Instagram fetch failed' });
  }
};
