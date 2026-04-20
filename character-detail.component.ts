import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { CharacterDummyService } from "../../../core/services/character-dummy.service";
import { CharacterProfile } from "../../../shared/models/character.model";

@Component({
  selector: "app-character-detail",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./character-detail.component.html",
  styleUrls: ["./character-detail.component.scss"],
})
export class CharacterDetailComponent implements OnInit {
  character!: CharacterProfile;

  constructor(private dummyService: CharacterDummyService) {}

  ngOnInit() {
    this.character = this.dummyService.getDummyCharacter();
  }
}
