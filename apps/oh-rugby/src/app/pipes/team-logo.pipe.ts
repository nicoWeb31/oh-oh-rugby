import { Pipe, PipeTransform } from '@angular/core';
import { teamLogoUrl } from '../data/team-visuals';

@Pipe({ name: 'teamLogo', standalone: true })
export class TeamLogoPipe implements PipeTransform {
  transform(teamName: string): string {
    return teamLogoUrl(teamName);
  }
}
