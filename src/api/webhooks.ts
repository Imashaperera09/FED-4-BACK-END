import express from 'express';
import { verifyWebhook } from '@clerk/express/webhooks'
import { User} from "../infrastructure/entities/User";

const webhooksRouter = express.Router();

webhooksRouter.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const evt = await verifyWebhook(req)

    // Do something with payload
    // For this guide, log payload to console
    const { id } = evt.data
    const eventType = evt.type
    console.log(`Received webhook with ID ${id} and event type of ${eventType}`)
    console.log('Webhook payload:', evt.data)

    if(eventType === 'user.created') {
      const userData = evt.data;
      const user = await User.findOne({ clerkUserId: userData.id });
      if (user) {
        return res.send('User already exists');
      }
      await User.create({
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email_addresses[0].email_address,
        clerkUserId: userData.id,
      });
    }
    return res.send('Webhook received')
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return res.status(400).send('Error verifying webhook')
  }
})

export default webhooksRouter;