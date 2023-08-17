import {URL} from 'url';

class Controller
{
    arrayIsSubsetOfArray(array1, array2)
    {
        return array1.every(value => array2.includes(value));
    }

    getBaseURL(req)
    {
        return new URL(`${req.protocol}://${req.get('host')}`);
    }
}

export default Controller;