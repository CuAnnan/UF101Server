import Controller from './Controller.js';
import UF101 from '../schemas/Uf101.schema.js';


const MESSAGES= {
    NO_OP_AUTH:"There is no Operational Authorisation on file for you"
};

class UF101Controller extends Controller
{
    async getOperatorUF101s(req, res)
    {
        if(req.session.user)
        {
            const uf101s = await UF101.find({operator:req.session.user});
            console.log(uf101s);
            res.json({operator:req.session.user, uf101s});
        }
    }

    validateUF101(formDataObject)
    {
        const modelKeys = Object.keys(UF101.schema);
        const formDataKeys = Object.keys(formDataObject);
        return this.arrayIsSubsetOfArray(formDataKeys, modelKeys);
    }

    async addUf101(req, res)
    {
        const user = req.session.user;
        if(user.uasOperatorRegistrationNumber) {
            try {
                const uf101 = await UF101.create(req.body);
                if (uf101) {
                    res.json({
                        success: true
                    });
                }
            }
            catch (e)
            {
                res.json({
                    success:false,
                    error:e
                })
            }
        }
        else
        {
            res.json({
                success:false,
                reason:MESSAGES.NO_OP_AUTH
            })
        }
    }
}

export default UF101Controller;