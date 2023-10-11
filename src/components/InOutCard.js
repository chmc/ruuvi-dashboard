import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import configs from '../configs'

const InOutCard = ({ ruuviDatas }) => {
    if (!ruuviDatas) {
        return <></>
    }
    const indoorRuuvi = ruuviDatas[configs.mainIndoorMac]
    const outdoorRuuvi = ruuviDatas[configs.mainOutdoorMac]

    return (
        <Grid item xs={4}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant='h5' component='div'>
                                Indoor
                            </Typography>
                            <Typography variant="h5" color="text.secondary">
                                {Math.round(indoorRuuvi.temperature * 100) / 100}c
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={6}>
                    <Card>
                        <CardContent>
                            <Typography variant='h5' component='div'>
                                Outdoor
                            </Typography>
                            <Typography variant="h5" color="text.secondary">
                                {Math.round(outdoorRuuvi.temperature * 100) / 100}c
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    )
}

export default InOutCard