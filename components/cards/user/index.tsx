import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Divider from '@material-ui/core/Divider';
import { withStyles, WithStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import React from 'react';

import { User } from 'pages/api/auth/login';
import styles from './styles';

const UserCard: React.FC<User & WithStyles<typeof styles>> = props => (
  <Card className={props.classes.card}>
    <CardMedia
      image={props.picture}
      title={props.username}
      className={props.classes.media}
    />
    <CardContent>
      <Typography variant="h5" component="h1">
        {props.name}
      </Typography>
      <Divider />
      <Typography variant="body2" component="p" color="textSecondary">
        {props.bio}
      </Typography>
    </CardContent>
  </Card>
);
UserCard.propTypes = {
  id: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  picture: PropTypes.string.isRequired,
  bio: PropTypes.string.isRequired,
};

export default withStyles(styles)(UserCard);
