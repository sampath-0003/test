import connectDB from './db/index.js';
import app from './app.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

connectDB();

try {
    app.on('error', (error) => {
        console.error(`Error: ${error.message}`);
    });
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });

} catch (error) {
    console.error(`Error: ${error.message} while listening`);
}

app.post('/api/register', async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(200).json({ message: 'Please enter all fields' });
        }

        const user = await User.findOne({ email });
        if (user) return res.status(200).json({ message: 'User already exists' });
        const hashPassword = await bcryptjs.hash(password, 10);
        const newUser = await User.create({
            email,
            password: hashPassword
        });
        send_otp(newUser);

        // generate a token for user and send it back to the user
        var token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: 300,
        });

        newUser.refreshToken = token;
        newUser.password = undefined;
        // newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        // console.error(error.message);
        // throw new Error('Server Error');
    }
    // res.send('Register')
}
);
app.post('/api/login', async (req, res) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(200).json({ message: 'Please enter all fields' });
        }
        const user = await user.findOne({ email });
        if (!user) return res.status(200).json({ message: 'User does not exist' });
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) return res.status(200).json({ message: 'Invalid credentials' });
        if (user.isverified === false) return res.status(200).json({ message: 'User is not verified' });

        const { accesstoken, refreshtoken } = await generateAccessAndRefreshToken(user);


        // //cookie section 
        const option = {
            httpOnly: true,
            secure: true
        };
        return res.status(201).cookie('refreshToken', refreshtoken, option).cookie('accessToken', accesstoken, option).json({ message: 'Login successful' });
    }
    catch (error) {
        // console.error(error.message);
        // throw new Error('Server Error');
        res.status(500).json({ message: 'Server Error' });
    }
    // res.send('Login')
}
);
const logout = async (req, res) => {
    try {




    } catch (error) {
      
    }
}
app.get('/verify/:token', async (req, res) => {
    try {
        const token = req.params.token;
        if (!token) return res.status(200).json({ message: 'Invalid token' });
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) return res.status(200).json({ message: 'Token verification failed, authorization denied' });
        const user = await User.findById(verified.id)
        if (!user) return res.status(200).json({ message: 'User does not exist' });
        user.isverified = true;
        user.save();
        res.status(201).json({ message: 'Account has been verified' });
    } catch (error) {
        // console.error(error.message);
        // throw new Error('Server Error');
    }

});
