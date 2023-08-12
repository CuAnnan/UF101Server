import {URL} from 'url';

class Controller
{
    getBaseURL(req)
    {
        return new URL(`${req.protocol}://${req.get('host')}`);
    }
}

export default Controller;