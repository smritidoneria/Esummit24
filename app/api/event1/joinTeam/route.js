import { connectMongoDB } from '@/lib/mongodb';
import { Event1 } from '@/models/event1.model';
import { event1TeamToken } from '@/models/event1TeamToken';
import { Users } from '@/models/user.model';
import { getTokenDetails } from '@/utils/authuser';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        console.log("++++++++++++++++++++++++++++++++++++++++11111122334");
        await connectMongoDB();

        const token = await getToken({ req });
        console.log("@@@@@@@@@@@",token)
        const auth = token ? token.accessTokenFromBackend : null;
        let userId = await getTokenDetails(auth);

       
        const user = await Users.findById({ _id: userId });
        console.log(user);

        if (user.event1TeamId) {
            return NextResponse.json({
                message: 'User is already a part of team',
            });
        }

        console.log("$$$$$$$$$$$$$$$$$$")

        const { teamCode } = await req.json();
        console.log('==========',teamCode);
        const team = await Event1.findOne({ teamCode: teamCode });
        console.log("+++++",team);
        //check if user is not a part of any team
        if (!team) {
            return NextResponse.json({ error: 'Team not found' });
        }
        if (team.members.length === 4) {
            return NextResponse.json({ error: 'Team is Full' });
        }
        // console.log(team)
        const Event1TeamToken = await event1TeamToken.findOne({ teamId: team._id });
        console.log("&&&&&&&",Event1TeamToken)
        if (!Event1TeamToken) {
            return res.status(404).json({ error: 'Token not found' });
        }

        console.log("*******")
        // const currentTime = new Date();
        // const tokenCreationTime = token.createdAt;

        // const timeDifference =
        //     (currentTime - tokenCreationTime) / (1000 * 60); // Difference in minutes
        //have to change this

        // if (timeDifference > 1000000000) {
        //     // Token expired, prompt for a new token
        //     return NextResponse.json({
        //         error: 'Token expired. Ask leader to generate a new token.',
        //     });
        // }
        if (teamCode !== Event1TeamToken.token) {
            return NextResponse.json({ error: 'Incorrect token' });
        }

        console.log("workss")
        await Users.findOneAndUpdate(
            { _id: userId },
            { $set: { event1TeamId: team.id, event1TeamRole: 1 } }
        );
        console.log("---------",team._id)

        await Event1.findOneAndUpdate(
            {
                _id: team._id,
            },
            {
                $push: { members: userId },
            }
        );
        return NextResponse.json({
            message: 'You have joined the team!',
        });
    } catch (error) {
        console.error('An error occurred:', error);
        return NextResponse.json({
            message: 'Error occurred ',
            status: 500,
        });
    }
}
